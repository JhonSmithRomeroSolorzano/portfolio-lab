import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { replayBatch } from "../scripts/batch.ts";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";
test("batch replay keeps line numbers, skips blanks, and continues after invalid rows", () => {
  const rows = replayBatch(`\n${JSON.stringify(DEFAULT_SCENARIO)}\r\n{\n{}\n`);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].line, 2);
  assert.ok(rows[0].ok);
  if (rows[0].ok) assert.deepEqual(rows[0].result, simulate(DEFAULT_SCENARIO));
  assert.deepEqual(
    rows.slice(1).map((r) => r.ok),
    [false, false],
  );
  assert.throws(() => replayBatch("x".repeat(1_048_577)), /1 MiB/);
});

test("CLI reports a closed output pipe without an uncaught error or success summary", async (t) => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/replay.ts"],
    {
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });
  const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
  t.after(() => clearTimeout(timeout));
  let stderr = "";
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdin.on("error", () => {});
  const closed = once(child, "close");
  child.stdout.destroy();
  child.stdin.end((JSON.stringify(DEFAULT_SCENARIO) + "\n").repeat(1000));
  const [status, signal] = await closed;
  assert.equal(
    signal,
    null,
    "CLI must finish without being killed by the deadline",
  );
  assert.equal(status, 2);
  assert.match(stderr, /Output error:.*EPIPE/);
  assert.doesNotMatch(
    stderr,
    /Unhandled|node:events|scenarios;|Results are illustrative/,
  );
});
test("CLI emits machine-readable results and useful exit codes", () => {
  const run = (input: string) =>
    spawnSync(process.execPath, ["--import", "tsx", "scripts/replay.ts"], {
      input,
      encoding: "utf8",
      timeout: 10_000,
    });
  const good = run(JSON.stringify(DEFAULT_SCENARIO));
  assert.equal(good.status, 0);
  assert.equal(JSON.parse(good.stdout).ok, true);
  const mixed = run(JSON.stringify(DEFAULT_SCENARIO) + "\nnope");
  assert.equal(mixed.status, 1);
  assert.deepEqual(
    mixed.stdout
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line).ok),
    [true, false],
  );
  assert.match(mixed.stderr, /2 scenarios; 1 invalid/);
  const empty = run("");
  assert.equal(empty.status, 0);
  assert.equal(empty.stdout, "");
  const oversized = run("x".repeat(1_048_577));
  assert.equal(oversized.status, 2);
  assert.match(oversized.stderr, /Input error: Input exceeds 1 MiB/);
  assert.equal(oversized.stdout, "");
});

test("CLI preserves every NDJSON result when its consumer starts reading late", async (t) => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/replay.ts"],
    {
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });
  const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
  t.after(() => clearTimeout(timeout));
  let stderr = "";
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdin.on("error", () => {});
  const closed = once(child, "close");
  const readable = once(child.stdout, "readable");
  const input = (JSON.stringify(DEFAULT_SCENARIO) + "\n").repeat(1000);
  child.stdin.end(input);
  await readable;
  // The deterministic Writable test separately proves the backpressure bound.
  const chunks: Buffer[] = [];
  for await (const chunk of child.stdout) chunks.push(chunk);
  const [status, signal] = await closed;
  assert.equal(
    signal,
    null,
    "CLI must finish without being killed by the deadline",
  );
  assert.equal(status, 0);
  assert.equal(
    Buffer.concat(chunks).toString("utf8"),
    replayBatch(input)
      .map((row) => JSON.stringify(row) + "\n")
      .join(""),
  );
  assert.match(stderr, /1000 scenarios; 0 invalid/);
});
