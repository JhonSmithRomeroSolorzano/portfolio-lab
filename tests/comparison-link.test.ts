import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shareComparisonUrl,
  baselineFromSearch,
  clearComparisonUrl,
} from "../archive/signal-lab/comparison-link.ts";
import { scenarioFromSearch } from "../archive/signal-lab/scenario-url.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("comparison links round trip both setups and omit unrelated URL data", () => {
  const current = {
    ...DEFAULT_SCENARIO,
    requestsPerSecond: 247,
    writePercent: 45,
  };
  const baseline = { ...DEFAULT_SCENARIO, cacheEnabled: false };
  const url = new URL(
    shareComparisonUrl(
      "https://example.com/portfolio/?session=private#resume",
      baseline,
      current,
    ),
  );
  assert.equal(url.pathname, "/portfolio/");
  assert.equal(url.hash, "#lab");
  assert.equal(url.searchParams.has("session"), false);
  assert.deepEqual(baselineFromSearch(url.search), baseline);
  assert.deepEqual(scenarioFromSearch(url.search), current);
  const cleared = new URL(clearComparisonUrl(url.href));
  assert.equal(baselineFromSearch(cleared.search), null);
  assert.deepEqual(scenarioFromSearch(cleared.search), current);
});
test("ambiguous, malformed and unknown-version shared baselines are ignored", () => {
  for (const search of [
    "?comparison=2&baseline={}",
    "?comparison=1&baseline={",
    "?comparison=1&baseline={}&baseline={}",
    "?comparison=1&comparison=1&baseline={}",
    "x".repeat(10001),
  ])
    assert.equal(baselineFromSearch(search), null);
});
