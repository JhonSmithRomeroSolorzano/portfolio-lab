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
