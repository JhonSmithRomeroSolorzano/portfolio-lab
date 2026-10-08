import { test } from "node:test";
import assert from "node:assert/strict";
import { evictCache, CACHE_KEYS } from "../src/labs/cache-eviction.ts";
test("LRU refreshes a hit while FIFO preserves insertion order", () => {
  const fifo = evictCache(3, "fifo"),
    lru = evictCache(3, "lru");
  assert.deepEqual(fifo.rows[3].cache, ["A", "B", "C"]);
  assert.deepEqual(lru.rows[3].cache, ["B", "C", "A"]);
  assert.equal(fifo.rows[4].evicted, "A");
  assert.equal(lru.rows[4].evicted, "B");
});
test("cache traces preserve bounded unique snapshots and read conservation", () => {
  for (const capacity of [2, 3, 4, 5])
    for (const policy of ["fifo", "lru"] as const) {
      const r = evictCache(capacity, policy);
      assert.equal(r.hits + r.misses, CACHE_KEYS.length);
      assert.ok(
        r.rows.every(
          (r) =>
            r.cache.length <= capacity &&
            new Set(r.cache).size === r.cache.length,
        ),
      );
      assert.deepEqual(r.rows[0].cache, ["A"]);
    }
  assert.equal(evictCache(5, "lru").misses, 5);
  assert.throws(() => evictCache(1, "lru"), RangeError);
});
