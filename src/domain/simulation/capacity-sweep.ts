import { simulate } from "./simulation";
import type { Scenario } from "./simulation";
export function capacitySweep(scenario: Scenario) {
  return Array.from({ length: 30 }, (_, index) => {
    const requestsPerSecond = (index + 1) * 20;
    return simulate({ ...scenario, requestsPerSecond });
  });
}
export function sweepCsv(scenario: Scenario) {
  const rows = capacitySweep(scenario).map((r) =>
    [r.offered, r.successful, r.failed, r.meanLatencyMs]
      .map((n) => Number(n.toFixed(3)))
      .join(","),
  );
  return (
    "offered_req_s,successful_req_s,failed_req_s,mean_latency_ms\n" +
    rows.join("\n") +
    "\n"
  );
}
