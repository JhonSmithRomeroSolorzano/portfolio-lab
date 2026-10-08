import { test } from "node:test";
import assert from "node:assert/strict";
import { retryExperiment } from "../src/retry-model.ts";
import { retryDistribution } from "../src/labs/retry-distribution.ts";
test("retry chart conserves both runs on the same inclusive final bucket", () => {
  const o = {
    retries: 3,
    budget: 24,
    baseDelayMs: 100,
    recoveryMs: 500,
    seed: 42,
  };
  const plain = retryExperiment({ ...o, jitter: false }),
    jitter = retryExperiment({ ...o, jitter: true });
  const { bins, end, peak } = retryDistribution(plain, jitter, o.recoveryMs);
  assert.equal(
    bins.reduce((n, b) => n + b.plain, 0),
    plain.length,
  );
  assert.equal(
    bins.reduce((n, b) => n + b.jitter, 0),
    jitter.length,
  );
  assert.equal(bins[1].plain, 8);
  assert.ok(
    end > Math.max(...plain.map((r) => r.at), ...jitter.map((r) => r.at)),
  );
  assert.ok(bins.every((b) => b.plain <= peak && b.jitter <= peak));
});
test("chart retains the recovery marker after all attempts have stopped", () => {
  const run = retryExperiment({
    retries: 0,
    budget: 0,
    baseDelayMs: 100,
    recoveryMs: 5000,
    seed: 42,
    jitter: false,
  });
  const chart = retryDistribution(run, run, 5000);
  assert.equal(chart.end, 5100);
  assert.equal(chart.bins[50].plain, 0);
});
