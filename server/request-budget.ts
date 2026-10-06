export interface BudgetOptions {
  limit?: number;
  windowMs?: number;
  now?: () => number;
}
/** Fixed-window, process-wide teaching limit; not a distributed abuse-prevention system. */
export function createRequestBudget({
  limit = 60,
  windowMs = 60_000,
  now = () => performance.now(),
}: BudgetOptions = {}) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 10_000 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1 ||
    windowMs > 3_600_000
  )
    throw new RangeError("Invalid request budget.");
  let start: number | undefined,
    used = 0;
  return () => {
    const time = now();
    if (start === undefined || time >= start + windowMs || time < start) {
      start = time;
      used = 0;
    }
    const allowed = used < limit;
    if (allowed) used++;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - used),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((start + windowMs - time) / 1000),
      ),
    };
  };
}
