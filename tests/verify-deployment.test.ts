import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { digest } from "../scripts/release";

const execute = promisify(execFile);
const script = fileURLToPath(
  new URL("../scripts/verify-deployment.ts", import.meta.url),
);
const source = "a".repeat(40);

test("deployment CLI fails closed without the correct trusted manifest and uses default or explicit local paths", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-verifier-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const html = "<html><body>portfolio</body></html>";
  const expected = {
    version: 1,
    source,
    files: { "index.html": digest(html), "assets/app.js": digest("code") },
  };
  let remote = expected;
  const requests: string[] = [];
  const server = createServer((req, res) => {
    assert.equal(req.headers["oai-sites-authorization"], undefined);
    requests.push(req.url!);
    res.end(
      req.url === "/release.json"
        ? JSON.stringify(remote)
        : req.url === "/"
          ? html
          : "code",
    );
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/`;

  const run = async (args: string[]) => {
    try {
      const result = await execute(
        process.execPath,
        ["--import", import.meta.resolve("tsx"), script, ...args],
        {
          cwd: directory,
          env: { ...process.env, GITHUB_SHA: source },
          timeout: 10_000,
          encoding: "utf8",
        },
      );
      return { status: 0, ...result };
    } catch (error) {
      const failure = error as Error & {
        code: number;
        killed: boolean;
        stdout: string;
        stderr: string;
      };
      assert.equal(
        failure.killed,
        false,
        "A hung CLI must fail this test, not count as a rejected manifest.",
      );
      assert.equal(typeof failure.code, "number");
      return {
        status: failure.code,
        stdout: failure.stdout,
        stderr: failure.stderr,
      };
    }
  };

  const missing = await run([url]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /dist\/release\.json/);
  assert.deepEqual(requests, []);
  await mkdir(join(directory, "dist"));
  await writeFile(join(directory, "dist/release.json"), "{bad");
  const malformed = await run([url]);
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stderr, /SyntaxError/);
  await writeFile(
    join(directory, "dist/release.json"),
    JSON.stringify({ ...expected, source: "b".repeat(40) }),
  );
  const wrongSource = await run([url]);
  assert.notEqual(wrongSource.status, 0);
  assert.match(
    wrongSource.stderr,
    /Trusted build manifest is from a different source/,
  );
  assert.deepEqual(requests, []);
  for (const args of [
    [url, "--manifest"],
    [url, "--manifest", "--private-stdin"],
    [url, "--unknown"],
    [url, "--manifest", "one.json", "--manifest", "two.json"],
  ]) {
    assert.notEqual((await run(args)).status, 0);
    assert.deepEqual(requests, []);
  }

  await writeFile(
    join(directory, "dist/release.json"),
    JSON.stringify(expected),
  );
  const valid = await run([url]);
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /2 matching assets/);
  assert.deepEqual(requests, ["/release.json", "/", "/assets/app.js"]);
  requests.length = 0;
  await writeFile(
    join(directory, "trusted manifest.json"),
    JSON.stringify(expected),
  );
  await rm(join(directory, "dist/release.json"));
  const explicit = await run(["--manifest", "trusted manifest.json", url, url]);
  assert.equal(explicit.status, 0, explicit.stderr);
  assert.equal(explicit.stdout.match(/Verified/g)?.length, 2);
  assert.equal(requests.length, 6);

  requests.length = 0;
  remote = {
    ...expected,
    files: { ...expected.files, "index.html": digest("modified build") },
  };
  const replaced = await run([url, "--manifest", "trusted manifest.json"]);
  assert.notEqual(replaced.status, 0);
  assert.match(replaced.stderr, /trusted build artifact/);
  assert.doesNotMatch(replaced.stdout, /Verified/);
  assert.deepEqual(requests, ["/release.json"]);
});
