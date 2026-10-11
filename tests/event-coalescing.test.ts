import { test } from "node:test";
import assert from "node:assert/strict";
import { coalesceInputs } from "../src/domain/simulation/event-coalescing.ts";
test("debounce delivers the latest value after quiet intervals and flushes the final input", () => {
  const r = coalesceInputs("burst", 200, "debounce");
  assert.deepEqual(
    r.emissions.map((e) => e.at),
    [540, 1000],
  );
  assert.equal(r.finalInputDelivered, true);
  assert.equal(coalesceInputs("steady", 100, "debounce").emissions.length, 10);
});
test("leading throttle bounds handler frequency but can lose the last input", () => {
  const r = coalesceInputs("steady", 400, "throttle");
  assert.deepEqual(
    r.emissions.map((e) => e.at),
    [0, 400, 800],
  );
  assert.equal(r.finalInputDelivered, false);
  for (const policy of ["every", "debounce", "throttle"] as const) {
    const r = coalesceInputs("burst", 200, policy);
    assert.equal(r.emissions.length + r.omitted, r.input.length);
  }
  assert.throws(() => coalesceInputs("burst", 0, "debounce"), RangeError);
});
