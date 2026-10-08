import { modelInteger } from "./model-input";
export function circuitBreaker(
  threshold: number,
  cooldown: number,
  recovery: number,
) {
  modelInteger(threshold, 1, 5);
  modelInteger(cooldown, 100, 700);
  modelInteger(recovery, 400, 1200);
  let state: "closed" | "open" | "half-open" = "closed",
    failures = 0,
    retryAt = 0;
  const rows = Array.from({ length: 16 }, (_, i) => {
    const at = i * 100;
    if (state === "open" && at >= retryAt) state = "half-open";
    const before = state;
    let outcome: "success" | "failure" | "blocked";
    if (state === "open") outcome = "blocked";
    else if (at >= 200 && at < recovery) {
      outcome = "failure";
      failures++;
      if (state === "half-open" || failures >= threshold) {
        state = "open";
        retryAt = at + cooldown;
      }
    } else {
      outcome = "success";
      state = "closed";
      failures = 0;
    }
    return {
      at,
      before,
      after: state,
      outcome,
      retryAt: state === "open" ? retryAt : null,
    };
  });
  return {
    rows,
    blocked: rows.filter((r) => r.outcome === "blocked").length,
    failures: rows.filter((r) => r.outcome === "failure").length,
    successes: rows.filter((r) => r.outcome === "success").length,
  };
}
