import { modelInteger } from "./model-input";
export const RATE_ARRIVALS = [
  0, 20, 40, 60, 80, 100, 900, 940, 980, 1000, 1020, 1040, 1060, 1100, 1900,
  2000,
] as const;
export type RatePolicy = "fixed" | "bucket";
export function limitArrivals(limit: number, policy: RatePolicy) {
  modelInteger(limit, 1, 10);
  if (!["fixed", "bucket"].includes(policy))
    throw new RangeError("Unknown rate policy.");
  let tokens = limit,
    last = 0,
    window = -1,
    used = 0;
  const rows = RATE_ARRIVALS.map((at) => {
    const currentWindow = Math.floor(at / 1000);
    if (currentWindow !== window) {
      window = currentWindow;
      used = 0;
    }
    tokens = Math.min(limit, tokens + ((at - last) * limit) / 1000);
    last = at;
    const accepted = policy === "fixed" ? used < limit : tokens >= 1 - 1e-9;
    if (accepted) {
      if (policy === "fixed") used++;
      else tokens = Math.max(0, tokens - 1);
    }
    return {
      at,
      accepted,
      remaining: policy === "fixed" ? limit - used : tokens,
      window,
    };
  });
  return {
    rows,
    accepted: rows.filter((r) => r.accepted).length,
    rejected: rows.filter((r) => !r.accepted).length,
  };
}
