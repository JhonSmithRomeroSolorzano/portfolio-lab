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
test("pool size sets capacity and cannot restore an offline database", () => {
  const s = {
    ...DEFAULT_SCENARIO,
    cacheEnabled: false,
    databaseConnections: 16,
  };
  assert.equal(simulate(s).databaseCapacity, 200);
  assert.equal(simulate({ ...s, database: "slow" }).databaseCapacity, 40);
  assert.equal(simulate({ ...s, database: "offline" }).databaseCapacity, 0);
  assert.equal(
    simulate({
      ...s,
      cacheEnabled: true,
      cacheHitPercent: 100,
      database: "offline",
    }).status,
    "healthy",
  );
});
test("pool configuration is portable and rejects unsafe values", () => {
  for (const databaseConnections of [1, 16, 32]) {
    const scenario = { ...DEFAULT_SCENARIO, databaseConnections };
    assert.deepEqual(
      scenarioFromSearch(
        new URL(scenarioUrl("https://example.com/", scenario)).search,
      ),
      scenario,
    );
    assert.equal(validScenario(scenario), true);
  }
  for (const databaseConnections of [0, 33, 1.5, NaN]) {
    assert.throws(
      () => simulate({ ...DEFAULT_SCENARIO, databaseConnections }),
      RangeError,
    );
    assert.equal(
      validScenario({ ...DEFAULT_SCENARIO, databaseConnections }),
      false,
    );
  }
  assert.equal(scenarioFromSearch("?pool=0").databaseConnections, undefined);
  assert.equal(
    scenarioFromSearch("?pool=1&pool=32").databaseConnections,
    undefined,
  );
});
