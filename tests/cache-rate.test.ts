import { test } from "node:test";
import assert from "node:assert/strict";
import {
  simulate,
  DEFAULT_SCENARIO,
} from "../src/domain/simulation/simulation.ts";
import {
  scenarioFromSearch,
  scenarioUrl,
} from "../archive/signal-lab/scenario-url.ts";
import { validScenario } from "../archive/signal-lab/experiment-library.ts";
test("cache hit boundaries route all requests correctly", () => {
  const none = simulate({ ...DEFAULT_SCENARIO, cacheHitPercent: 0 });
  const all = simulate({
    ...DEFAULT_SCENARIO,
    cacheHitPercent: 100,
    database: "offline",
  });
  assert.equal(none.cacheHits, 0);
  assert.equal(all.databaseDemand, 0);
  assert.equal(all.successPercent, 100);
  assert.equal(all.meanLatencyMs, 20);
  assert.throws(() => simulate({ ...DEFAULT_SCENARIO, cacheHitPercent: 101 }));
});
test("cache settings round trip and invalid inputs are rejected", () => {
  for (const hit of [0, 5, 95, 100]) {
    const scenario = { ...DEFAULT_SCENARIO, cacheHitPercent: hit };
    assert.deepEqual(
      scenarioFromSearch(
        new URL(scenarioUrl("https://example.com/", scenario)).search,
      ),
      scenario,
    );
  }
  assert.equal(scenarioFromSearch("?hit=1000").cacheHitPercent, undefined);
  assert.equal(
    validScenario({ ...DEFAULT_SCENARIO, cacheHitPercent: -1 }),
    false,
  );
});
