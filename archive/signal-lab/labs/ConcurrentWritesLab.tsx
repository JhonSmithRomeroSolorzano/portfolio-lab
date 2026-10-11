import { useIndependentLab } from "./LabSettingsProvider";
import { ToolPanel } from "../ToolPanel";
import { LabRange, LabChoice } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { concurrentWrites } from "../../../src/domain/simulation/concurrent-writes";
export function ConcurrentWritesLab({ active }: { active: boolean }) {
  const [{ firstDelta, secondDelta, policy }, update] =
    useIndependentLab("writes");
  const run = concurrentWrites(firstDelta, secondDelta, policy);
  return (
    <ToolPanel title="Two clients, one shared value">
      <div className="tool-content">
        <p>
          Both clients read value 10 at version 1. Client A saves first. Client
          B still holds the old snapshot. Compare a blind overwrite with a
          version check and an explicit reread/retry.
        </p>
        <div className="lab-fields">
          <LabRange
            label="Client A change"
            value={firstDelta}
            min={-5}
            max={10}
            onChange={(value) => update({ firstDelta: value })}
          />
          <LabRange
            label="Client B change"
            value={secondDelta}
            min={-5}
            max={10}
            onChange={(value) => update({ secondDelta: value })}
          />
          <LabChoice
            label="Conflict policy"
            value={policy}
            options={[
              { value: "overwrite", label: "Blind overwrite" },
              { value: "reject", label: "Reject stale version" },
              { value: "retry", label: "Reread and retry delta" },
            ]}
            onChange={(value) => update({ policy: value })}
          />
        </div>
        <div
          className="lab-outcome"
          data-tone={run.value === run.expected ? "good" : "warning"}
        >
          <span>Committed value</span>
          <strong>
            {run.value} <small>· version {run.version}</small>
          </strong>
          <p>
            Applying both changes would give {run.expected}.{" "}
            {policy === "reject"
              ? "The second change is rejected for the caller to resolve."
              : policy === "overwrite"
                ? "A blind overwrite can lose Client A’s change."
                : "The retry applies Client B’s delta to the latest value."}
          </p>
        </div>
        <EventInspector
          active={active}
          events={run.rows.map((r) => ({
            at: r.at,
            title: r.title,
            detail: `Committed state: value ${r.value}, version ${r.version}.`,
            tone:
              r.outcome === "conflict"
                ? "warning"
                : r.outcome === "saved"
                  ? "good"
                  : "neutral",
          }))}
        />
        <p className="lab-assumptions">
          A deterministic illustration of atomic version checks, not a database
          connection. Changes are additive and safe to reapply after a confirmed
          rejection. Retrying arbitrary side effects or unknown outcomes
          requires a different design; this model has no lost acknowledgments.
        </p>
      </div>
    </ToolPanel>
  );
}
