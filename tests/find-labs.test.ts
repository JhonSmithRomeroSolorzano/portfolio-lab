import { test } from "node:test";
import assert from "node:assert/strict";
import { findLabs } from "../archive/signal-lab/labs/find-labs.ts";
test("lab discovery combines words with area filters and searches behavior descriptions", () => {
  assert.deepEqual(
    findLabs("  SLOW   RESPONSE ", "Frontend").map((lab) => lab.id),
    ["search"],
  );
  assert.equal(findLabs("SLOW RESPONSE", "Data").length, 0);
  assert.ok(findLabs("cache", "Data").some((lab) => lab.id === "eviction"));
  assert.equal(findLabs("", "Frontend").length, 2);
  assert.deepEqual(findLabs("unmatched-term", "All"), []);
});
