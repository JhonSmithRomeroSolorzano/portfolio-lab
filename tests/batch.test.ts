import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
test("CLI emits machine-readable results and useful exit codes", () => {
  const run = (input: string) =>
    spawnSync(process.execPath, ["--import", "tsx", "scripts/replay.ts"], {
      input,
      encoding: "utf8",
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
});
