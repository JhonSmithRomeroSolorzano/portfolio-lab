import { DEFAULT_SCENARIO } from "./simulation";
import type { Scenario } from "./simulation";

const KEYS = ["traffic", "cache", "database"] as const;

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
  return {
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
}

/** Preserve the host, deployment subpath, unrelated query parameters, and fragment. */
export function scenarioUrl(currentUrl: string, scenario: Scenario): string {
  const url = new URL(currentUrl);
  KEYS.forEach((key) => url.searchParams.delete(key));
  if (scenario.requestsPerSecond !== DEFAULT_SCENARIO.requestsPerSecond) {
    url.searchParams.set("traffic", String(scenario.requestsPerSecond));
  }
  if (!scenario.cacheEnabled) url.searchParams.set("cache", "off");
  if (scenario.database !== DEFAULT_SCENARIO.database)
    url.searchParams.set("database", scenario.database);
  return url.toString();
}
