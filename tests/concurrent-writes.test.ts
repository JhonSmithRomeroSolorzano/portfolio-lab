import { test } from "node:test";
import assert from "node:assert/strict";
import { concurrentWrites } from "../src/domain/simulation/concurrent-writes.ts";
test("blind overwrite loses a change while version checks prevent stale commits", () => {
  const overwrite = concurrentWrites(1, 5, "overwrite"),
    reject = concurrentWrites(1, 5, "reject"),
    retry = concurrentWrites(1, 5, "retry");
  assert.equal(overwrite.value, 15);
  assert.equal(reject.value, 11);
  assert.equal(reject.version, 2);
  assert.equal(retry.value, 16);
  assert.equal(retry.version, 3);
  assert.equal(retry.conflicts, 1);
});
test("reread and retry preserves additive intent including decrements and zero changes", () => {
  for (const a of [-5, 0, 10])
    for (const b of [-5, 0, 10]) {
      const r = concurrentWrites(a, b, "retry");
      assert.equal(r.value, 10 + a + b);
      assert.deepEqual(
        r.rows.map((r) => r.version),
        [1, 2, 2, 2, 3],
      );
    }
  assert.throws(() => concurrentWrites(1.5, 5, "retry"), RangeError);
});
