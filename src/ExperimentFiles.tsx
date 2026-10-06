import { useId, useRef, useState } from "react";
import {
  downloadText,
  exportExperiment,
  importExperiment,
} from "./experiment-file";
import type { Scenario } from "./simulation";
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
    <details className="tool-panel">
      <summary>Import or export an experiment</summary>
      <div className="tool-content">
        <p role="status">{message}</p>
        <div className="tool-actions">
          <button
            onClick={() =>
              downloadText(
                exportExperiment(scenario),
                "signal-lab-experiment.json",
              )
            }
          >
            Download experiment JSON
          </button>
        </div>
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
    </details>
  );
}
