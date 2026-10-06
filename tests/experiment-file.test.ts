import { test } from "node:test";
import assert from "node:assert/strict";
import { exportExperiment, importExperiment } from "../src/experiment-file.ts";
import { DEFAULT_SCENARIO } from "../src/simulation.ts";
test("experiment snapshots round trip without trusting stored result values", () => {
  const value = JSON.parse(exportExperiment(DEFAULT_SCENARIO));
  value.result.successPercent = 999;
  assert.deepEqual(importExperiment(JSON.stringify(value)), DEFAULT_SCENARIO);
});
test("unknown formats, corrupt data, and oversized files fail clearly", () => {
  for (const raw of [
    "{",
    "{}",
    JSON.stringify({
      format: "signal-lab",
      version: 2,
      scenario: DEFAULT_SCENARIO,
    }),
    " ".repeat(100001),
  ])
    assert.throws(() => importExperiment(raw));
});
