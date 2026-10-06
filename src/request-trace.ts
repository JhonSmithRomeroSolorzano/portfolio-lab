import { MODEL, simulate } from "./simulation";
import type { Scenario } from "./simulation";
export type TraceRoute = "cache" | "database" | "timeout";
export function availableRoutes(scenario: Scenario): TraceRoute[] {
  const r = simulate(scenario);
  return [
    ...(r.cacheHits > 0 ? ["cache" as const] : []),
    ...(r.databaseServed > 0 ? ["database" as const] : []),
    ...(r.failed > 0 ? ["timeout" as const] : []),
  ];
}
export function requestTrace(scenario: Scenario, route: TraceRoute) {
  if (!availableRoutes(scenario).includes(route))
    throw new Error("This outcome does not occur in the selected scenario.");
  const steps = [
    { at: 0, label: "The client sends a request." },
    { at: MODEL.apiLatencyMs, label: "The API finishes its modeled overhead." },
  ];
  if (route === "cache")
    steps.push({ at: 20, label: "The warm cache returns the response." });
  else {
    steps.push({
      at: MODEL.apiLatencyMs,
      label:
        (scenario.writePercent ?? 0) > 0
          ? "An uncached read or a write needs the database. Writes bypass the cache."
          : scenario.cacheEnabled
            ? "The read misses the cache."
            : "The read bypasses the cache.",
    });
    steps.push({
      at:
        MODEL.apiLatencyMs +
        (route === "timeout"
          ? MODEL.timeoutMs
          : MODEL.databaseLatencyMs[scenario.database]),
      label:
        route === "timeout"
          ? "The request times out; no response data is returned."
          : "A database connection returns the response.",
    });
  }
  return steps;
}
