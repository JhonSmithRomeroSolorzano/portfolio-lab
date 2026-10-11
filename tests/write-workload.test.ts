import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";
import {
  scenarioFromSearch,
  scenarioUrl,
} from "../archive/signal-lab/scenario-url.ts";
import { validScenario } from "../archive/signal-lab/experiment-library.ts";
test("writes bypass a perfect cache and preserve the request budget", () => {
  const s = { ...DEFAULT_SCENARIO, cacheHitPercent: 100, writePercent: 25 };
  const r = simulate(s);
  assert.equal(r.reads, 90);
  assert.equal(r.writes, 30);
  assert.equal(r.cacheHits, 90);
  assert.equal(r.databaseDemand, 30);
  const offline = simulate({ ...s, database: "offline" });
  assert.equal(offline.successPercent, 75);
  assert.equal(simulate({ ...s, writePercent: 100 }).cacheHits, 0);
});
test("write share round trips and rejects invalid inputs", () => {
  for (const writePercent of [1, 25, 100]) {
    const s = { ...DEFAULT_SCENARIO, writePercent };
    assert.deepEqual(
      scenarioFromSearch(
        new URL(scenarioUrl("https://example.com/", s)).search,
      ),
      s,
    );
    assert.equal(validScenario(s), true);
  }
  for (const writePercent of [-1, 101, NaN, 1.5]) {
    assert.throws(
      () => simulate({ ...DEFAULT_SCENARIO, writePercent }),
      RangeError,
    );
    assert.equal(validScenario({ ...DEFAULT_SCENARIO, writePercent }), false);
  }
  assert.equal(
    scenarioFromSearch("?writes=25&writes=75").writePercent,
    undefined,
  );
});
