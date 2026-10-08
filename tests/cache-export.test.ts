import { test } from "node:test";
import assert from "node:assert/strict";
import { cacheTimelineCsv } from "../src/cache-export.ts";
test("cache CSV includes configuration and every read, including background fetches", () => {
  const rows = cacheTimelineCsv(8, "swr")
    .trim()
    .split("\n")
    .map((line) => line.split(","));
  assert.equal(rows.length, 22);
  assert.ok(rows.every((r) => r.length === 10));
  assert.deepEqual(rows[9], [
    "swr",
    "8",
    "8",
    "cache",
    "2",
    "1",
    "true",
    "8",
    "1",
    "true",
  ]);
  assert.equal(rows[10][5], "2");
  assert.throws(() => cacheTimelineCsv(0, "ttl"));
});
