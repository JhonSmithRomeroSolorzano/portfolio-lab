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

test("invalidation observes the update immediately and background refresh has a one-read lag", () => {
  const invalidated = cacheTimeline(8, "invalidate");
  assert.equal(invalidated.filter((r) => r.stale).length, 0);
  assert.equal(invalidated[5].source, "database");
  const swr = cacheTimeline(8, "swr");
  assert.equal(swr[8].refreshing, true);
  assert.equal(swr[8].returnedVersion, 1);
  assert.equal(swr[9].returnedVersion, 2);
  assert.equal(swr[9].refreshing, false);
  assert.equal(swr[8].originReads, 1);
  assert.equal(swr[9].originReads, 0);
});
test("background fetches keep their captured version when origin updates before completion", () => {
  const rows = cacheTimeline(4, "swr");
  assert.equal(rows[4].refreshing, true);
  assert.equal(rows[5].returnedVersion, 1);
  assert.equal(rows[5].stale, true);
  for (const policy of ["ttl", "invalidate", "swr"] as const)
    for (let ttl = 1; ttl <= 12; ttl++) {
      const rows = cacheTimeline(ttl, policy);
      assert.equal(rows.length, 21);
      assert.ok(rows.every((r) => r.originReads === 0 || r.originReads === 1));
      assert.equal(rows[0].source, "database");
    }
});
