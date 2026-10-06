import type { Scenario } from "./simulation";
export function validScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const s = value as Scenario;
  return (
    Number.isInteger(s.requestsPerSecond) &&
    s.requestsPerSecond >= 20 &&
    s.requestsPerSecond <= 600 &&
    s.requestsPerSecond % 20 === 0 &&
    typeof s.cacheEnabled === "boolean" &&
    (s.cacheHitPercent === undefined ||
      (Number.isInteger(s.cacheHitPercent) &&
        s.cacheHitPercent >= 0 &&
        s.cacheHitPercent <= 100)) &&
    (s.databaseConnections === undefined ||
      (Number.isInteger(s.databaseConnections) &&
        s.databaseConnections >= 1 &&
        s.databaseConnections <= 32)) &&
    (s.writePercent === undefined ||
      (Number.isInteger(s.writePercent) &&
        s.writePercent >= 0 &&
        s.writePercent <= 100)) &&
    ["normal", "slow", "offline"].includes(s.database)
  );
}

/** Service and batch boundaries reject unknown fields to catch misspelled settings. */
export function validStrictScenario(value: unknown): value is Scenario {
  const fields = [
    "requestsPerSecond",
    "cacheEnabled",
    "database",
    "cacheHitPercent",
    "databaseConnections",
    "writePercent",
  ];
  return (
    validScenario(value) &&
    Object.keys(value).every((key) => fields.includes(key))
  );
}
