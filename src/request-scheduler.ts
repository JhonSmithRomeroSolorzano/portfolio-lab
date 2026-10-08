export interface SchedulerOptions {
  concurrency: number;
  serviceMs: number;
  buffer: number;
}
export interface ScheduledRequest {
  id: number;
  arrivedAt: number;
  startedAt: number | null;
  finishedAt: number;
  outcome: "served" | "rejected";
}
export const SCHEDULER_ARRIVALS = [
  0, 0, 0, 0, 50, 50, 100, 100, 100, 100, 150, 200, 200, 250, 300, 300,
] as const;
/** Completion and FIFO dispatch happen before new arrivals at the same instant. */
export function scheduleRequests(
  options: SchedulerOptions,
  arrivals: readonly number[] = SCHEDULER_ARRIVALS,
): ScheduledRequest[] {
  const { concurrency, serviceMs, buffer } = options;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 8 ||
    !Number.isInteger(serviceMs) ||
    serviceMs < 10 ||
    serviceMs > 1000 ||
    !Number.isInteger(buffer) ||
    buffer < 0 ||
    buffer > 40
  )
    throw new RangeError(
      "Use 1–8 workers, 10–1,000 ms service, and a 0–40 request buffer.",
    );
  if (
    arrivals.length > 120 ||
    arrivals.some(
      (n, i) =>
        !Number.isInteger(n) ||
        n < 0 ||
        n > 60_000 ||
        (i > 0 && n < arrivals[i - 1]),
    )
  )
    throw new RangeError(
      "Use up to 120 ordered arrival times from 0 to 60,000 ms.",
    );
  const waiting: Array<{ id: number; arrivedAt: number }> = [];
  let active: ScheduledRequest[] = [];
  const completed: ScheduledRequest[] = [];
  let index = 0;
  const start = (request: { id: number; arrivedAt: number }, at: number) =>
    active.push({
      ...request,
      startedAt: at,
      finishedAt: at + serviceMs,
      outcome: "served",
    });
  while (index < arrivals.length || active.length || waiting.length) {
    const now = Math.min(
      arrivals[index] ?? Infinity,
      ...active.map((r) => r.finishedAt),
    );
    completed.push(...active.filter((r) => r.finishedAt === now));
    active = active.filter((r) => r.finishedAt > now);
    while (waiting.length && active.length < concurrency)
      start(waiting.shift()!, now);
    while (index < arrivals.length && arrivals[index] === now) {
      const request = { id: index + 1, arrivedAt: now };
      index++;
      if (active.length < concurrency) start(request, now);
      else if (waiting.length < buffer) waiting.push(request);
      else
        completed.push({
          ...request,
          startedAt: null,
          finishedAt: now,
          outcome: "rejected",
        });
    }
  }
  return completed.sort((a, b) => a.id - b.id);
}
