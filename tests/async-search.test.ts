import { test } from "node:test";
import assert from "node:assert/strict";
import { searchResponses } from "../src/labs/async-search.ts";
test("latest-request guard prevents an older slow response from overwriting results", () => {
  const unguarded = searchResponses(800, 100, "every"),
    guarded = searchResponses(800, 100, "latest");
  assert.equal(unguarded.visible, "r");
  assert.equal(guarded.visible, "react");
  assert.equal(guarded.ignored, 2);
  assert.equal(unguarded.rows.length, 6);
  assert.equal(guarded.rows.filter((r) => r.kind === "response").length, 3);
});
test("responses before the next input may render; equal-time inputs take priority", () => {
  assert.equal(searchResponses(50, 100, "latest").rows[1].applied, true);
  assert.equal(
    searchResponses(100, 100, "latest").rows.find(
      (r) => r.kind === "response" && r.id === 1,
    )?.applied,
    false,
  );
  for (const delay of [50, 100, 1000])
    assert.equal(searchResponses(delay, delay, "latest").visible, "react");
  assert.throws(() => searchResponses(NaN, 100, "latest"), RangeError);
});
