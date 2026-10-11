import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exportComparison,
  importComparison,
} from "../archive/signal-lab/comparison-file.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("comparison snapshots round trip both setups without trusting stored results", () => {
  const pair = {
    baseline: DEFAULT_SCENARIO,
    current: {
      ...DEFAULT_SCENARIO,
      writePercent: 100,
      database: "offline" as const,
    },
  };
  const raw = JSON.parse(exportComparison(pair));
  raw.result = { successPercent: 100 };
  assert.deepEqual(importComparison(JSON.stringify(raw)), pair);
});
test("one invalid setup rejects the entire comparison", () => {
  const pair = { baseline: DEFAULT_SCENARIO, current: DEFAULT_SCENARIO };
  for (const raw of [
    "{",
    "x".repeat(100001),
    JSON.stringify({ ...JSON.parse(exportComparison(pair)), version: 2 }),
    JSON.stringify({
      ...JSON.parse(exportComparison(pair)),
      current: { ...DEFAULT_SCENARIO, requestPerSecond: 400 },
    }),
  ])
    assert.throws(() => importComparison(raw));
});
