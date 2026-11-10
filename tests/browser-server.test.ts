import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const configURL = new URL("../playwright.config.ts", import.meta.url).href;
const cli = fileURLToPath(import.meta.resolve("@playwright/test/cli"));

function environment(ci: boolean, port?: string) {
  const env = { ...process.env };
  delete env.CI;
  delete env.PLAYWRIGHT_PORT;
  if (ci) env.CI = "true";
  if (port !== undefined) env.PLAYWRIGHT_PORT = port;
  return env;
}

function inspectConfig(ci: boolean, port?: string) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `
    import config from ${JSON.stringify(configURL)};
    const server = config.webServer[0];
    console.log(JSON.stringify({
      baseURL: config.use.baseURL, command: server.command, url: server.url,
      reuse: server.reuseExistingServer, retries: config.retries,
      workers: config.workers, projects: config.projects.map(project => project.name),
    }));
  `,
    ],
    {
      cwd: root,
      env: environment(ci, port),
      encoding: "utf8",
      timeout: 10_000,
    },
  );
}

test("browser preview settings use one validated loopback port locally and in CI", () => {
  for (const ci of [false, true]) {
    for (const [requested, expected] of [
      [undefined, 4173],
      ["4199", 4199],
      ["04199", 4199],
      ["1", 1],
      ["65535", 65535],
    ] as const) {
      const result = inspectConfig(ci, requested);
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
      const config = JSON.parse(result.stdout);
      assert.equal(config.baseURL, `http://127.0.0.1:${expected}`);
      assert.equal(config.url, config.baseURL);
      assert.equal(
        config.command,
        `npm run preview -- --port ${expected} --strictPort`,
      );
      assert.equal(config.reuse, false);
      assert.equal(config.retries, ci ? 1 : 0);
      assert.equal(config.workers, ci ? 2 : undefined);
      assert.deepEqual(config.projects, ["chromium", "webkit"]);
    }
  }
});

test("invalid browser ports fail config loading instead of changing the host or shell command", () => {
  for (const value of [
    "",
    "0",
    "65536",
    "-1",
    "1.5",
    "4e3",
    " 4173",
    "4173 ",
    "4173\n",
    "\t4173",
    "4173; echo unexpected",
    "http://127.0.0.1:4173",
  ]) {
    const result = inspectConfig(false, value);
    assert.ifError(result.error);
    assert.notEqual(result.status, 0, value);
    assert.match(
      result.stderr,
      /PLAYWRIGHT_PORT must be an integer between 1 and 65535/,
    );
  }
});

async function runCLI(config: string, env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, [cli, "test", "--config", config], {
    cwd: root,
    env,
    detached: true,
    stdio: "pipe",
  });
  let stdout = "",
    stderr = "",
    expired = false;
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  const closed = once(child, "close");
  child.stdin.end();
  const terminate = () => {
    if (!child.pid) return;
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  };
  const deadline = setTimeout(() => {
    expired = true;
    terminate();
  }, 20_000);
  try {
    const [code, signal] = await closed;
    assert.equal(
      expired,
      false,
      "CLI must fail for the busy port, not the test deadline",
    );
    assert.equal(signal, null);
    return { code, stdout, stderr };
  } finally {
    clearTimeout(deadline);
    // This group belongs to the test, never the unrelated listening server.
    terminate();
  }
}

for (const ci of [false, true]) {
  test(`${ci ? "CI" : "local"} browser runner rejects an occupied port before a journey and leaves its server alive`, async (t) => {
    const directory = await mkdtemp(
      join(tmpdir(), "portfolio-browser-server-"),
    );
    t.after(() => rm(directory, { recursive: true, force: true }));
    const server = createServer((_req, res) =>
      res.end("unrelated preview"),
    ).listen(0, "127.0.0.1");
    t.after(
      () =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
          server.closeAllConnections();
        }),
    );
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const marker = join(directory, "journey-started");
    await mkdir(join(directory, "journeys"));
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ type: "module" }),
    );
    await writeFile(
      join(directory, "journeys/sentinel.spec.ts"),
      `
      import { test } from ${JSON.stringify(import.meta.resolve("@playwright/test"))};
      import { writeFileSync } from "node:fs";
      test("sentinel journey", () => { writeFileSync(${JSON.stringify(marker)}, "started"); });
    `,
    );
    const config = join(directory, "playwright.config.ts");
    await writeFile(
      config,
      `
      import original from ${JSON.stringify(configURL)};
      export default {
        ...original,
        testDir: ${JSON.stringify(join(directory, "journeys"))},
        outputDir: ${JSON.stringify(join(directory, "results"))},
        reporter: "list", workers: 1, retries: 0,
        projects: [{ name: "sentinel" }],
      };
    `,
    );
    const result = await runCLI(config, environment(ci, String(address.port)));
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, /already used/);
    assert.equal(
      existsSync(marker),
      false,
      "No journey should execute against this preview",
    );
    const response = await fetch(`http://127.0.0.1:${address.port}/`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(await response.text(), "unrelated preview");
  });
}
