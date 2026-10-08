import { useState } from "react";
import { ToolPanel } from "../ToolPanel";
import { LabRange } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { circuitBreaker } from "./circuit-breaker";
export function CircuitBreakerLab() {
  const [threshold, setThreshold] = useState(3),
    [cooldown, setCooldown] = useState(500),
    [recovery, setRecovery] = useState(800);
  const run = circuitBreaker(threshold, cooldown, recovery);
  return (
    <ToolPanel title="Give a failing service time to recover">
      <div className="tool-content">
        <p>
          A caller tries every 100 ms. The service starts failing at 200 ms.
          After repeated failures, the circuit blocks calls until a recovery
          probe is allowed.
        </p>
        <div className="lab-fields">
          <LabRange
            label="Failures before opening"
            value={threshold}
            min={1}
            max={5}
            onChange={setThreshold}
          />
          <LabRange
            label="Circuit cooldown"
            value={cooldown}
            min={100}
            max={700}
            step={100}
            unit=" ms"
            onChange={setCooldown}
          />
          <LabRange
            label="Service recovers at"
            value={recovery}
            min={400}
            max={1200}
            step={100}
            unit=" ms"
            onChange={setRecovery}
          />
        </div>
        <div className="policy-comparison">
          <div>
            <span>Service successes</span>
            <strong>{run.successes}</strong>
          </div>
          <div>
            <span>Service failures</span>
            <strong>{run.failures}</strong>
          </div>
          <div>
            <span>Calls blocked</span>
            <strong>{run.blocked}</strong>
          </div>
        </div>
        <div className="lab-outcome">
          <span>Protection trade-off</span>
          <strong>
            {run.rows.length - run.blocked} / {run.rows.length} calls reach the
            service
          </strong>
          <p>
            A blocked call fails fast at the caller. It is not a successful
            request or an automatic retry.
          </p>
        </div>
        <EventInspector
          events={run.rows.map((r) => ({
            at: r.at,
            title: `${r.before} → ${r.after}`,
            detail: `${r.outcome === "blocked" ? "Call blocked locally" : r.outcome === "failure" ? "Service call failed" : "Service call succeeded"}.${r.retryAt !== null ? ` A probe is allowed at ${r.retryAt} ms.` : " Failure count is reset after success."}`,
            tone:
              r.outcome === "success"
                ? "good"
                : r.outcome === "failure"
                  ? "warning"
                  : "neutral",
          }))}
        />
        <p className="lab-assumptions">
          Sixteen sequential calls from 0 to 1500 ms. Responses are
          instantaneous; one half-open probe succeeds or fails before the next
          call. Success closes the circuit; a failed probe starts another
          cooldown. No concurrency, rolling error window, fallback, or real
          service is involved.
        </p>
      </div>
    </ToolPanel>
  );
}
