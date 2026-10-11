import { test } from "node:test";
import assert from "node:assert/strict";
import { circuitBreaker } from "../src/domain/simulation/circuit-breaker.ts";
test("a circuit opens at the failure threshold and probes on the cooldown boundary", () => {
  const r = circuitBreaker(3, 500, 800);
  assert.equal(r.rows[4].after, "open");
  assert.equal(r.rows[8].outcome, "blocked");
  assert.equal(r.rows[9].before, "half-open");
  assert.equal(r.rows[9].after, "closed");
  assert.equal(r.failures, 3);
  assert.equal(r.blocked, 4);
});
test("a failed probe reopens rather than letting all calls through", () => {
  const r = circuitBreaker(1, 500, 800);
  assert.equal(r.rows[7].before, "half-open");
  assert.equal(r.rows[7].outcome, "failure");
  assert.equal(r.rows[7].retryAt, 1200);
  assert.equal(r.rows[12].outcome, "success");
  for (const threshold of [1, 3, 5])
    for (const cooldown of [100, 700]) {
      const r = circuitBreaker(threshold, cooldown, 1000);
      assert.equal(r.blocked + r.failures + r.successes, 16);
    }
  assert.throws(() => circuitBreaker(0, 500, 800), RangeError);
});
