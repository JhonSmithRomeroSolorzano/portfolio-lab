import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
import {
  capacitySweep,
  sweepCsv,
} from "../src/domain/simulation/capacity-sweep.ts";
test("sweep locates saturation while preserving current configuration", () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    cacheEnabled: false,
    databaseConnections: 16,
  };
  const rows = capacitySweep(scenario);
  assert.equal(rows.length, 30);
  assert.equal(rows.find((r) => r.failed > 0)?.offered, 220);
  assert.equal(rows.at(-1)?.successful, 200);
  assert.equal(scenario.requestsPerSecond, 120);
});
test("offline sweep and CSV preserve request counts", () => {
  const scenario = { ...DEFAULT_SCENARIO, database: "offline" as const };
  for (const row of capacitySweep(scenario))
    assert.ok(Math.abs(row.successful + row.failed - row.offered) < 1e-8);
  const lines = sweepCsv(scenario).trim().split("\n");
  assert.equal(lines.length, 31);
  assert.deepEqual(lines[1].split(",").slice(0, 3), ["20", "16", "4"]);
});
