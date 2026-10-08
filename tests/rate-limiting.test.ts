import { test } from "node:test";
import assert from "node:assert/strict";
import { limitArrivals } from "../src/labs/rate-limiting.ts";
test("fixed windows reset exactly at the boundary and conserve admissions", () => {
  const r = limitArrivals(4, "fixed");
  assert.equal(r.rows.find((r) => r.at === 980)?.accepted, false);
  assert.equal(r.rows.find((r) => r.at === 1000)?.accepted, true);
  for (const window of [0, 1, 2])
    assert.ok(
      r.rows.filter((r) => r.window === window && r.accepted).length <= 4,
    );
  assert.equal(r.accepted + r.rejected, 16);
});
test("token bucket respects capacity, continuous refill, and finite budgets", () => {
  for (let limit = 1; limit <= 10; limit++) {
    const r = limitArrivals(limit, "bucket");
    assert.equal(r.accepted + r.rejected, 16);
    assert.ok(r.rows.every((r) => r.remaining >= 0 && r.remaining <= limit));
    for (const row of r.rows)
      assert.ok(
        r.rows.filter((r) => r.at <= row.at && r.accepted).length <=
          Math.floor(limit + (row.at * limit) / 1000 + 1e-9),
      );
  }
  assert.throws(() => limitArrivals(Infinity, "bucket"), RangeError);
});
