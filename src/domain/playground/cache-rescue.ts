export interface RescueSettings {
  requests: number;
  originMs: number;
  spacingMs: number;
}
export type RescueRoute = "origin" | "shared" | "hit";
export interface RescueRequest {
  id: number;
  arrival: number;
  completed: number;
  route: RescueRoute;
}
export type RescueState = "pending" | "waiting" | "querying" | "done";

/** One expired key, a fixed successful fetch, and unlimited origin concurrency.
 * A refill completing at an arrival's timestamp is visible to that arrival.
 * Single-flight is scoped to this modeled coordinator, not a distributed lock.
 */
export function rescueRun(
  settings: RescueSettings,
  coalesce: boolean,
): RescueRequest[] {
  const { requests, originMs, spacingMs } = settings;
  if (
    !Number.isInteger(requests) ||
    requests < 1 ||
    requests > 36 ||
    !Number.isInteger(originMs) ||
    originMs < 100 ||
    originMs > 800 ||
    !Number.isInteger(spacingMs) ||
    spacingMs < 0 ||
    spacingMs > 100
  )
    throw new RangeError("Invalid cache rescue workload.");
  return Array.from({ length: requests }, (_, index) => {
    const arrival = index * spacingMs;
    const route: RescueRoute =
      arrival >= originMs ? "hit" : coalesce && index > 0 ? "shared" : "origin";
    return {
      id: index + 1,
      arrival,
      route,
      completed:
        route === "hit"
          ? arrival
          : route === "shared"
            ? originMs
            : arrival + originMs,
    };
  });
}

export function rescueState(request: RescueRequest, time: number): RescueState {
  if (time < request.arrival) return "pending";
  if (time >= request.completed) return "done";
  return request.route === "shared" ? "waiting" : "querying";
}

export function rescueSnapshot(run: RescueRequest[], time: number) {
  return {
    queries: run.filter((r) => r.route === "origin" && r.arrival <= time)
      .length,
    waiting: run.filter((r) => rescueState(r, time) === "waiting").length,
    done: run.filter((r) => rescueState(r, time) === "done").length,
    hits: run.filter((r) => r.route === "hit" && r.arrival <= time).length,
  };
}

export function rescueEvents(...runs: RescueRequest[][]): number[] {
  return [
    ...new Set([
      -25,
      ...runs.flatMap((run) => run.flatMap((r) => [r.arrival, r.completed])),
    ]),
  ].sort((a, b) => a - b);
}
