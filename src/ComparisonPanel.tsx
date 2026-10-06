import { useState } from "react";
import { compareScenarios, signed } from "./comparison";
import type { Scenario } from "./simulation";

export function Comparison({ scenario }: { scenario: Scenario }) {
  const [baseline, setBaseline] = useState<Scenario | null>(null);
  const delta = baseline ? compareScenarios(baseline, scenario) : null;
  return (
    <details className="tool-panel">
      <summary>Compare two setups</summary>
      <div className="tool-content">
        <p>
          Capture a baseline, then change the controls above. Differences below
          are current minus baseline.
        </p>
        <div className="tool-actions">
          <button onClick={() => setBaseline({ ...scenario })}>
            {baseline ? "Update baseline" : "Capture baseline"}
          </button>
          {baseline && (
            <button onClick={() => setBaseline(null)}>Clear baseline</button>
          )}
        </div>
        {baseline && delta && (
          <>
            <p>
              Baseline: {baseline.requestsPerSecond} req/s · cache{" "}
              {baseline.cacheEnabled ? "on" : "off"} · database{" "}
              {baseline.database}.
            </p>
            <div className="tool-metrics" aria-live="polite">
              <div>
                <span>Mean response</span>
                <strong>{signed(delta.latencyMs)} ms</strong>
                <small>Lower is better</small>
              </div>
              <div>
                <span>Successful requests</span>
                <strong>{signed(delta.successPoints)} pp</strong>
                <small>Higher is better</small>
              </div>
              <div>
                <span>Database demand</span>
                <strong>{signed(delta.databaseRequests)} /s</strong>
                <small>Lower is less pressure</small>
              </div>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
