import { simulate } from "./simulation";
import type { Scenario } from "./simulation";

export function compareScenarios(baseline: Scenario, current: Scenario) {
  const before = simulate(baseline);
  const after = simulate(current);
  return {
    latencyMs: after.meanLatencyMs - before.meanLatencyMs,
    successPoints: after.successPercent - before.successPercent,
    databaseRequests: after.databaseDemand - before.databaseDemand,
  };
}

export function signed(value: number, digits = 1) {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}
