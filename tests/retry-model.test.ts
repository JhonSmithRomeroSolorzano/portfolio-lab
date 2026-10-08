import { test } from "node:test";
import assert from "node:assert/strict";
import { retryExperiment } from "../src/retry-model.ts";
const base = {
  retries: 3,
  budget: 24,
  baseDelayMs: 100,
  recoveryMs: 500,
  jitter: false,
  seed: 42,
};
test("backoff crosses recovery and counts initial requests separately from retry budget", () => {
  const rows = retryExperiment(base);
  assert.equal(rows.length, 32);
  assert.equal(rows.filter((r) => r.outcome === "success").length, 8);
  assert.deepEqual(
    rows.filter((r) => r.request === 1).map((r) => r.at),
    [0, 100, 300, 700],
  );
  assert.equal(retryExperiment({ ...base, recoveryMs: 0 }).length, 8);
  assert.equal(retryExperiment({ ...base, budget: 0 }).length, 8);
});
test("seeded jitter is deterministic and all paths respect global and per-request bounds", () => {
  for (const jitter of [false, true])
    for (const budget of [0, 1, 13, 40])
      for (const retries of [0, 2, 5]) {
        const o = { ...base, jitter, budget, retries, recoveryMs: 5000 };
        const rows = retryExperiment(o);
        assert.deepEqual(rows, retryExperiment(o));
        assert.ok(rows.length <= 8 + budget);
        assert.ok(rows.every((r) => r.at >= 0 && r.attempt <= retries + 1));
        assert.equal(rows.filter((r) => r.nextAt === null).length, 8);
        assert.ok(rows.every((r) => r.nextAt === null || r.nextAt > r.at));
      }
  assert.throws(() => retryExperiment({ ...base, budget: 41 }));
});
