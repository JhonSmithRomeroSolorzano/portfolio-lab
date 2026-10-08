import { compareScenarios, signed } from "./comparison";
import { simulate } from "./simulation";
import type { Scenario } from "./simulation";

export function comparisonReport(
  baseline: Scenario,
  current: Scenario,
): string {
  const before = simulate(baseline),
    after = simulate(current);
  const delta = compareScenarios(baseline, current);
  const setting = (s: Scenario) => [
    s.requestsPerSecond,
    s.cacheEnabled ? "on" : "off",
    s.cacheHitPercent ?? 80,
    s.database,
    s.databaseConnections ?? 8,
    s.writePercent ?? 0,
  ];
  const a = setting(baseline),
    b = setting(current);
  return [
    "# Signal Lab comparison",
    "",
    "Illustrative model, not production measurements.",
    "",
    "## Settings",
    "",
    "| Setting | Baseline | Current |",
    "| --- | ---: | ---: |",
    ...[
      "Traffic (req/s)",
      "Read cache",
      "Read cache hit rate (%)",
      "Database",
      "Connections",
      "Writes (%)",
    ].map((name, i) => `| ${name} | ${a[i]} | ${b[i]} |`),
    "",
    "## Results",
    "",
    "Differences are current minus baseline.",
    "",
    "| Metric | Baseline | Current | Difference |",
    "| --- | ---: | ---: | ---: |",
    `| Mean response (ms) | ${before.meanLatencyMs.toFixed(1)} | ${after.meanLatencyMs.toFixed(1)} | ${signed(delta.latencyMs)} |`,
    `| Successful requests (%) | ${before.successPercent.toFixed(1)} | ${after.successPercent.toFixed(1)} | ${signed(delta.successPoints)} pp |`,
    `| Database demand (req/s) | ${before.databaseDemand.toFixed(1)} | ${after.databaseDemand.toFixed(1)} | ${signed(delta.databaseRequests)} |`,
    "",
    "Lower latency is better; higher success is better. Less database demand reduces pressure, but a read cache does not protect writes.",
    "",
    "## Assumptions",
    "",
    "Steady-state rates; 12 ms API overhead, 8 ms cache reads, 80/400 ms normal/slow database operations, and 1,000 ms timeouts. Mean response includes failures. No queues, retries, network variance, or cache expiry are included.",
    "",
  ].join("\n");
}
