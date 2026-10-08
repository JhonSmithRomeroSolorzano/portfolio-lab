import { useState } from "react";
import { ToolPanel } from "../ToolPanel";
import { LabRange, LabChoice } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { limitArrivals } from "./rate-limiting";
import type { RatePolicy } from "./rate-limiting";
export function RateLimitLab() {
  const [limit, setLimit] = useState(4),
    [policy, setPolicy] = useState<RatePolicy>("fixed");
  const run = limitArrivals(limit, policy);
  return (
    <ToolPanel title="A request budget at the window boundary">
      <div className="tool-content">
        <p>
          The same 16 arrivals include a burst around the one-second boundary.
          Fixed windows reset their budget at once. A token bucket refills
          gradually while allowing a bounded initial burst.
        </p>
        <div className="lab-fields">
          <LabRange
            label="Allowed requests per second"
            value={limit}
            min={1}
            max={10}
            onChange={setLimit}
          />
          <LabChoice
            label="Rate limiter"
            value={policy}
            options={[
              { value: "fixed", label: "Fixed one-second window" },
              { value: "bucket", label: "Continuously refilled token bucket" },
            ]}
            onChange={setPolicy}
          />
        </div>
        <div className="lab-outcome">
          <span>Admission result</span>
          <strong>
            {run.accepted} accepted · {run.rejected} rejected
          </strong>
          <p>
            Rejected calls do not enter a queue. Change the policy to inspect
            how the same nominal rate treats this burst.
          </p>
        </div>
        <div className="policy-comparison">
          <div>
            <span>Fixed window</span>
            <strong>{limitArrivals(limit, "fixed").accepted} accepted</strong>
          </div>
          <div>
            <span>Token bucket</span>
            <strong>{limitArrivals(limit, "bucket").accepted} accepted</strong>
          </div>
          <div>
            <span>Offered</span>
            <strong>16 requests</strong>
          </div>
        </div>
        <EventInspector
          events={run.rows.map((r) => ({
            at: r.at,
            title: r.accepted ? "Request accepted" : "Request rejected",
            detail:
              policy === "fixed"
                ? `Window ${r.window}: ${r.remaining} admissions remain until ${(r.window + 1) * 1000} ms.`
                : `${r.remaining.toFixed(2)} tokens remain; a request requires one full token.`,
            tone: r.accepted ? "good" : "warning",
          }))}
        />
        <p className="lab-assumptions">
          One process, instantaneous admission, a fixed arrival sequence, no
          retries or service time. Windows are half-open [start, end). The
          bucket starts full, holds at most one second of budget, and refills
          continuously at the selected rate.
        </p>
      </div>
    </ToolPanel>
  );
}
