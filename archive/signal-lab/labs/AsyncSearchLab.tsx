import { useIndependentLab } from "./LabSettingsProvider";
import { ToolPanel } from "../ToolPanel";
import { LabRange, LabChoice } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { searchResponses } from "../../../src/domain/simulation/async-search";
export function AsyncSearchLab({ active }: { active: boolean }) {
  const [{ oldDelay, newestDelay, policy }, update] =
    useIndependentLab("search");
  const run = searchResponses(oldDelay, newestDelay, policy);
  return (
    <ToolPanel title="When an old search arrives last">
      <div className="tool-content">
        <p>
          Three searches leave as the visitor types <code>r → re → react</code>.
          A slow response can overwrite newer results. Choose whether every
          response may render, or only the latest request.
        </p>
        <div className="lab-fields">
          <LabRange
            label="First response delay"
            value={oldDelay}
            min={50}
            max={1000}
            step={50}
            unit=" ms"
            onChange={(value) => update({ oldDelay: value })}
          />
          <LabRange
            label="Latest response delay"
            value={newestDelay}
            min={50}
            max={1000}
            step={50}
            unit=" ms"
            onChange={(value) => update({ newestDelay: value })}
          />
          <LabChoice
            label="Response policy"
            value={policy}
            options={[
              { value: "every", label: "Apply every response" },
              { value: "latest", label: "Only the latest request" },
            ]}
            onChange={(value) => update({ policy: value })}
          />
        </div>
        <div className="lab-outcome" data-tone={run.stale ? "warning" : "good"}>
          <span>Final visible result</span>
          <strong>{run.visible}</strong>
          <p>
            {run.stale
              ? "An old response replaced the latest search."
              : "The final result matches the latest search."}{" "}
            {run.ignored} responses ignored.
          </p>
        </div>
        <EventInspector
          active={active}
          events={run.rows.map((r) => ({
            at: r.at,
            title:
              r.kind === "input"
                ? `Search “${r.query}” sent`
                : r.applied
                  ? `“${r.query}” rendered`
                  : `“${r.query}” ignored`,
            detail:
              r.kind === "input"
                ? `Request ${r.id} is now the newest request.`
                : `Visible result after this response: ${r.visible || "none"}.`,
            tone:
              r.kind === "input"
                ? "neutral"
                : r.applied && r.query !== "react"
                  ? "warning"
                  : "good",
          }))}
        />
        <p className="lab-assumptions">
          Deterministic UI model. Searches start at 0, 100, and 200 ms; the
          middle response takes 250 ms. Input events precede responses at the
          same instant. Ignoring a result does not cancel backend work.
        </p>
      </div>
    </ToolPanel>
  );
}
