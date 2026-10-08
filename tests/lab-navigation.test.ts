import { test } from "node:test";
import assert from "node:assert/strict";
import { labFromSearch, labUrl, labEntryUrl } from "../src/lab-navigation.ts";
import { DEFAULT_SCENARIO } from "../src/simulation.ts";
import { shareComparisonUrl } from "../src/comparison-link.ts";
test("lab navigation validates selections and keeps old comparison links compatible", () => {
  assert.equal(labFromSearch("?lab=cache"), "cache");
  assert.equal(labFromSearch("?lab=cache&lab=queue"), "traffic");
  assert.equal(labFromSearch("?lab=missing"), "traffic");
  const comparison = new URL(
    shareComparisonUrl(
      "https://example.com/project/",
      DEFAULT_SCENARIO,
      DEFAULT_SCENARIO,
    ),
  );
  assert.equal(labFromSearch(comparison.search), "compare");
  comparison.searchParams.set("lab", "cache");
  assert.equal(labFromSearch(comparison.search), "cache");
});
test("navigation retains host context while entry links omit unrelated parameters", () => {
  const source =
    "https://example.com/project/?session=private&traffic=300#resume";
  const nav = new URL(labUrl(source, "queue"));
  assert.equal(nav.pathname, "/project/");
  assert.equal(nav.searchParams.get("session"), "private");
  const shared = new URL(labEntryUrl(source, "cache", DEFAULT_SCENARIO));
  assert.equal(shared.search, "?lab=cache");
  assert.equal(shared.hash, "#lab");
});
