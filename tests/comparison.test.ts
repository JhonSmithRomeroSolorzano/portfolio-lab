import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareScenarios,
  signed,
} from "../src/domain/simulation/comparison.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";

test("comparison shows the direction of a cache improvement", () => {
  const delta = compareScenarios(
    { ...DEFAULT_SCENARIO, cacheEnabled: false },
    DEFAULT_SCENARIO,
  );
  assert.ok(delta.latencyMs < 0);
  assert.ok(delta.successPoints > 0);
  assert.equal(delta.databaseRequests, -96);
  assert.deepEqual(compareScenarios(DEFAULT_SCENARIO, DEFAULT_SCENARIO), {
    latencyMs: 0,
    successPoints: 0,
    databaseRequests: 0,
  });
});
test("delta formatting avoids misleading negative zero", () => {
  assert.equal(signed(-0.01), "0");
  assert.equal(signed(12.34), "+12.3");
  assert.equal(signed(-4), "-4");
});
