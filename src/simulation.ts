export type DatabaseMode = "normal" | "slow" | "offline";
export type SystemStatus =
  "healthy" | "overloaded" | "degraded" | "unavailable";

export interface Scenario {
  requestsPerSecond: number;
  cacheEnabled: boolean;
  database: DatabaseMode;
  cacheHitPercent?: number;
  databaseConnections?: number;
}

export const DEFAULT_SCENARIO: Scenario = {
  requestsPerSecond: 120,
  cacheEnabled: true,
  database: "normal",
};

/** Illustrative steady-state model; these values are assumptions, not benchmarks. */
export const MODEL = {
  cacheHitRatio: 0.8,
  cacheLatencyMs: 8,
  apiLatencyMs: 12,
  timeoutMs: 1000,
  databaseConnections: 8,
  databaseLatencyMs: { normal: 80, slow: 400, offline: 1000 },
} as const;

export function simulate(scenario: Scenario) {
  if (
    !Number.isFinite(scenario.requestsPerSecond) ||
    scenario.requestsPerSecond < 1 ||
    scenario.requestsPerSecond > 600
  ) {
    throw new RangeError(
      "Request rate must be between 1 and 600 requests per second.",
    );
  }
  if (!Object.hasOwn(MODEL.databaseLatencyMs, scenario.database)) {
    throw new RangeError("Unknown database mode.");
  }
  const offered = scenario.requestsPerSecond;
  const hitPercent = scenario.cacheHitPercent ?? MODEL.cacheHitRatio * 100;
  if (!Number.isInteger(hitPercent) || hitPercent < 0 || hitPercent > 100)
    throw new RangeError("Cache hit rate must be an integer from 0 to 100.");
  const cacheHits = scenario.cacheEnabled ? (offered * hitPercent) / 100 : 0;
  const databaseDemand = offered - cacheHits;
  const connections = scenario.databaseConnections ?? MODEL.databaseConnections;
  if (!Number.isInteger(connections) || connections < 1 || connections > 32)
    throw new RangeError("Connection pool must contain 1 to 32 connections.");
  const databaseLatency = MODEL.databaseLatencyMs[scenario.database];
  const databaseCapacity =
    scenario.database === "offline"
      ? 0
      : (connections * 1000) / databaseLatency;
  const databaseServed = Math.min(databaseDemand, databaseCapacity);
  const successful = cacheHits + databaseServed;
  const failed = offered - successful;
  const meanLatencyMs =
    MODEL.apiLatencyMs +
    (cacheHits * MODEL.cacheLatencyMs +
      databaseServed * databaseLatency +
      failed * MODEL.timeoutMs) /
      offered;
  const status: SystemStatus =
    failed === 0
      ? "healthy"
      : scenario.database === "offline"
        ? cacheHits > 0
          ? "degraded"
          : "unavailable"
        : failed > 0
          ? "overloaded"
          : "healthy";

  return {
    offered,
    cacheHits,
    databaseDemand,
    databaseServed,
    databaseCapacity,
    successful,
    failed,
    meanLatencyMs,
    status,
    successPercent: (successful / offered) * 100,
    utilizationPercent:
      databaseCapacity > 0
        ? Math.min(100, (databaseDemand / databaseCapacity) * 100)
        : 0,
  };
}
