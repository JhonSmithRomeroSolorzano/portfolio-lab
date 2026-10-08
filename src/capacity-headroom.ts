import { MODEL, simulate } from "./simulation";
import type { Scenario } from "./simulation";
/** Analytical capacity under exactly the same steady-state assumptions as simulate. */
export function capacityHeadroom(scenario: Scenario) {
  const result = simulate(scenario);
  const databaseFraction = scenario.cacheEnabled
    ? ((100 - (scenario.writePercent ?? 0)) *
        (100 - (scenario.cacheHitPercent ?? 80)) +
        (scenario.writePercent ?? 0) * 100) /
      10_000
    : 1;
  const maximumTraffic =
    databaseFraction === 0
      ? null
      : Math.floor((result.databaseCapacity + 1e-9) / databaseFraction);
  const minimumConnections =
    scenario.database === "offline"
      ? null
      : Math.max(
          0,
          Math.ceil(
            (result.databaseDemand *
              MODEL.databaseLatencyMs[scenario.database]) /
              1000 -
              1e-9,
          ),
        );
  return {
    maximumTraffic,
    minimumConnections,
    spareDatabaseCapacity: result.databaseCapacity - result.databaseDemand,
    allReadsCached: databaseFraction === 0,
  };
}
