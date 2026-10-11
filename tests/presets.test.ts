import { test } from "node:test";
import assert from "node:assert/strict";
import { PRESETS } from "../src/domain/simulation/presets.ts";
import { simulate } from "../src/domain/simulation/simulation.ts";
test("guided experiments cover distinct operational outcomes", () => {
  assert.deepEqual(
    PRESETS.map((p) => simulate(p.scenario).status),
    ["healthy", "overloaded", "degraded"],
  );
  const cached = PRESETS[0].scenario;
  assert.equal(
    simulate({ ...cached, cacheEnabled: false }).status,
    "overloaded",
  );
});
