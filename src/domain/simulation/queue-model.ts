export const BURST = [4, 4, 20, 20, 4, 4, 4, 4] as const;
/** Each one-second tick serves old backlog first, then arrivals; overflow is rejected. */
export function queueTimeline(
  capacity: number,
  buffer: number,
  arrivals: readonly number[] = BURST,
) {
  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 16 ||
    !Number.isInteger(buffer) ||
    buffer < 0 ||
    buffer > 40
  )
    throw new RangeError("Capacity must be 1–16 and buffer must be 0–40.");
  if (
    arrivals.length > 120 ||
    arrivals.some((n) => !Number.isInteger(n) || n < 0 || n > 600)
  )
    throw new RangeError("Use at most 120 ticks, each with 0–600 arrivals.");
  let queued = 0,
    totalArrived = 0,
    totalServed = 0,
    totalRejected = 0;
  return arrivals.map((incoming, index) => {
    const backlog = queued;
    const served = Math.min(backlog + incoming, capacity);
    const unserved = backlog + incoming - served;
    queued = Math.min(buffer, unserved);
    const rejected = unserved - queued;
    totalArrived += incoming;
    totalServed += served;
    totalRejected += rejected;
    return {
      second: index + 1,
      incoming,
      backlog,
      served,
      queued,
      rejected,
      totalArrived,
      totalServed,
      totalRejected,
    };
  });
}

/** Equal volume isolates burst shape rather than changing total demand. */
export const QUEUE_PROFILES = [
  { id: "burst", name: "Two-second burst", arrivals: BURST },
  { id: "steady", name: "Steady flow", arrivals: [8, 8, 8, 8, 8, 8, 8, 8] },
  { id: "spike", name: "Single spike", arrivals: [4, 4, 4, 36, 4, 4, 4, 4] },
] as const;

/** After arrivals stop, serve accepted backlog; rejected work is never retried. */
export function queueRecovery(
  capacity: number,
  buffer: number,
  arrivals: readonly number[] = BURST,
) {
  const rows = queueTimeline(capacity, buffer, arrivals);
  let last = rows.at(-1);
  while (last && last.queued > 0) {
    const served = Math.min(capacity, last.queued);
    const next = {
      second: last.second + 1,
      incoming: 0,
      backlog: last.queued,
      served,
      queued: last.queued - served,
      rejected: 0,
      totalArrived: last.totalArrived,
      totalServed: last.totalServed + served,
      totalRejected: last.totalRejected,
    };
    rows.push(next);
    last = next;
  }
  return rows;
}
