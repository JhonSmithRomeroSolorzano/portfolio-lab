export interface RetryOptions {
  retries: number;
  budget: number;
  baseDelayMs: number;
  recoveryMs: number;
  jitter: boolean;
  seed: number;
}
export interface RetryAttempt {
  request: number;
  attempt: number;
  at: number;
  outcome: "success" | "retry scheduled" | "attempt limit" | "budget exhausted";
  nextAt: number | null;
}
/** Eight simultaneous requests; service instantly succeeds once the outage ends. */
export function retryExperiment(o: RetryOptions): RetryAttempt[] {
  if (
    !Number.isInteger(o.retries) ||
    o.retries < 0 ||
    o.retries > 5 ||
    !Number.isInteger(o.budget) ||
    o.budget < 0 ||
    o.budget > 40 ||
    !Number.isInteger(o.baseDelayMs) ||
    o.baseDelayMs < 10 ||
    o.baseDelayMs > 500 ||
    !Number.isInteger(o.recoveryMs) ||
    o.recoveryMs < 0 ||
    o.recoveryMs > 5000 ||
    !Number.isInteger(o.seed) ||
    o.seed < 0 ||
    o.seed > 0xffffffff ||
    typeof o.jitter !== "boolean"
  )
    throw new RangeError("Retry options are outside the supported range.");
  let state = o.seed >>> 0,
    used = 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const pending = Array.from({ length: 8 }, (_, i) => ({
    request: i + 1,
    attempt: 1,
    at: 0,
  }));
  const rows: RetryAttempt[] = [];
  while (pending.length) {
    pending.sort((a, b) => a.at - b.at || a.request - b.request);
    const event = pending.shift()!;
    let outcome: RetryAttempt["outcome"],
      nextAt: number | null = null;
    if (event.at >= o.recoveryMs) outcome = "success";
    else if (event.attempt > o.retries) outcome = "attempt limit";
    else if (used >= o.budget) outcome = "budget exhausted";
    else {
      const ceiling = o.baseDelayMs * 2 ** (event.attempt - 1);
      const delay = o.jitter
        ? Math.max(1, Math.floor(random() * ceiling))
        : ceiling;
      nextAt = event.at + delay;
      used++;
      outcome = "retry scheduled";
      pending.push({
        request: event.request,
        attempt: event.attempt + 1,
        at: nextAt,
      });
    }
    rows.push({ ...event, outcome, nextAt });
  }
  return rows;
}
