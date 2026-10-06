import { DEFAULT_SCENARIO } from "./simulation";
import type { Scenario } from "./simulation";

const KEYS = ["traffic", "cache", "database", "hit", "pool"] as const;

/** Invalid or repeated parameters fall back independently to safe defaults. */
export function scenarioFromSearch(search: string): Scenario {
  const params = new URLSearchParams(search);
  const single = (key: string) =>
    params.getAll(key).length === 1 ? params.get(key) : null;
  const traffic = single("traffic");
  const rate =
    traffic !== null && /^\d+$/.test(traffic) ? Number(traffic) : NaN;
  const cache = single("cache");
  const database = single("database");
  const result: Scenario = {
    requestsPerSecond:
      Number.isInteger(rate) && rate >= 20 && rate <= 600 && rate % 20 === 0
        ? rate
        : DEFAULT_SCENARIO.requestsPerSecond,
    cacheEnabled: cache === "off" ? false : DEFAULT_SCENARIO.cacheEnabled,
    database:
      database === "normal" || database === "slow" || database === "offline"
        ? database
        : DEFAULT_SCENARIO.database,
  };
  const hit = single("hit");
  if (
    hit !== null &&
    /^\d+$/.test(hit) &&
    Number(hit) >= 0 &&
    Number(hit) <= 100 &&
    Number(hit) !== 80
  )
    result.cacheHitPercent = Number(hit);
  const pool = single("pool");
  if (
    pool !== null &&
    /^\d+$/.test(pool) &&
    Number(pool) >= 1 &&
    Number(pool) <= 32 &&
    Number(pool) !== 8
  )
    result.databaseConnections = Number(pool);
  return result;
}

/** Preserve the host, deployment subpath, unrelated query parameters, and fragment. */
export function scenarioUrl(currentUrl: string, scenario: Scenario): string {
  const url = new URL(currentUrl);
  KEYS.forEach((key) => url.searchParams.delete(key));
  if (scenario.requestsPerSecond !== DEFAULT_SCENARIO.requestsPerSecond) {
    url.searchParams.set("traffic", String(scenario.requestsPerSecond));
  }
  if (!scenario.cacheEnabled) url.searchParams.set("cache", "off");
  if (scenario.cacheHitPercent !== undefined && scenario.cacheHitPercent !== 80)
    url.searchParams.set("hit", String(scenario.cacheHitPercent));
  if (scenario.database !== DEFAULT_SCENARIO.database)
    url.searchParams.set("database", scenario.database);
  if (
    scenario.databaseConnections !== undefined &&
    scenario.databaseConnections !== 8
  )
    url.searchParams.set("pool", String(scenario.databaseConnections));
  return url.toString();
}
