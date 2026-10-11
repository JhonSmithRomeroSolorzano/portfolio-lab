import { ToolPanel } from "./ToolPanel";
import { TextExport } from "./TextExport";
import { useId, useRef, useState } from "react";
import { exportExperiment, importExperiment } from "./experiment-file";
import type { Scenario } from "../../src/domain/simulation/simulation";
export function ExperimentFiles({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (s: Scenario) => void;
}) {
  const id = useId();
  const request = useRef(0);
  const [message, setMessage] = useState(
    "Export a reproducible snapshot or import one from another browser. Results are recalculated on import.",
  );
  return (
    <ToolPanel title="Import or export an experiment">
      <div className="tool-content">
        <p role="status">{message}</p>
        <TextExport
          text={exportExperiment(scenario)}
          filename="signal-lab-experiment.json"
          kind="experiment JSON"
        />
        <label htmlFor={id}>Import experiment JSON (up to 100 KB)</label>
        <input
          className="tool-file"
          id={id}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const current = ++request.current;
            if (!file) return;
            try {
              if (file.size > 100_000)
                throw new Error("Choose an experiment smaller than 100 KB.");
              const next = importExperiment(await file.text());
              if (current === request.current) {
                onSelect(next);
                setMessage(
                  "Experiment loaded. Results have been recalculated.",
                );
              }
            } catch (error) {
              if (current === request.current)
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Could not read this file.",
                );
            }
          }}
        />
      </div>
    </ToolPanel>
  );
}
