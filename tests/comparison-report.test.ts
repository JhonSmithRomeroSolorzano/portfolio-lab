import { test } from "node:test";
import assert from "node:assert/strict";
import { comparisonReport } from "../archive/signal-lab/comparison-report.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("reports reproduce both inputs and explain differences without suggesting measured data", () => {
  const report = comparisonReport(
    { ...DEFAULT_SCENARIO, cacheEnabled: false },
    DEFAULT_SCENARIO,
  );
  assert.ok(report.includes("| Read cache | off | on |"));
  assert.ok(
    report.includes("| Database demand (req/s) | 120.0 | 24.0 | -96 |"),
  );
  assert.ok(
    report.includes("Illustrative model, not production measurements."),
  );
  assert.ok(report.includes("Mean response includes failures"));
});
test("identical and offline comparisons remain finite and keep all optional controls", () => {
  const s = {
    ...DEFAULT_SCENARIO,
    database: "offline" as const,
    cacheHitPercent: 0,
    databaseConnections: 32,
    writePercent: 100,
  };
  const report = comparisonReport(s, s);
  assert.ok(report.includes("| Writes (%) | 100 | 100 |"));
  assert.ok(report.includes("| Successful requests (%) | 0.0 | 0.0 | 0 pp |"));
  assert.ok(!/NaN|Infinity|\| -0/.test(report));
});
