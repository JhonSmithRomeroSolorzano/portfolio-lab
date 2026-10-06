import { test } from "node:test";
import assert from "node:assert/strict";
import { cacheTimeline } from "../src/cache-expiry.ts";
test("a long TTL trades database reads for temporarily stale responses", () => {
  const rows = cacheTimeline(8);
  assert.deepEqual(
    rows.filter((r) => r.source === "database").map((r) => r.second),
    [0, 8, 16],
  );
  assert.deepEqual(
    rows.filter((r) => r.stale).map((r) => r.second),
    [5, 6, 7],
  );
  assert.equal(rows[8].returnedVersion, 2);
  assert.equal(rows[1].expiresAt, 8);
});
test("expiry at the origin update fetches fresh data at the exact boundary", () => {
  assert.equal(cacheTimeline(5).filter((r) => r.stale).length, 0);
  assert.equal(
    cacheTimeline(1).every((r) => r.source === "database"),
    true,
  );
  for (const ttl of [0, 13, 1.5, NaN])
    assert.throws(() => cacheTimeline(ttl), RangeError);
});
