import { TextExport } from "./TextExport";
import { comparisonReport } from "./comparison-report";
import { loadBaseline, saveBaseline } from "./comparison-storage";
import { useState } from "react";
import { compareScenarios, signed } from "./comparison";
import type { Scenario } from "./simulation";

export function Comparison({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (value: Scenario) => void;
}) {
  const [baseline, setBaseline] = useState<Scenario | null>(loadBaseline);
  const [notice, setNotice] = useState(
    "Your baseline is saved only in this browser.",
  );
  function capture(value: Scenario | null) {
    setBaseline(value);
    let saved = false;
    try {
      saved = saveBaseline(value, localStorage);
    } catch {
      /* Storage may be blocked. */
    }
    setNotice(
      saved
        ? value
          ? "Baseline saved in this browser."
          : "Saved baseline cleared."
        : "Storage unavailable. This baseline lasts only for this visit.",
    );
  }
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
          <button onClick={() => capture({ ...scenario })}>
            {baseline ? "Update baseline" : "Capture baseline"}
          </button>
          {baseline && (
            <>
              <button
                onClick={() => {
                  onSelect({ ...baseline });
                  setNotice("Baseline restored to the controls.");
                }}
              >
                Restore baseline
              </button>
              <button onClick={() => capture(null)}>Clear baseline</button>
            </>
          )}
        </div>
        <p role="status">{notice}</p>
        {baseline && delta && (
          <>
            <p>
              Baseline: {baseline.requestsPerSecond} req/s · cache{" "}
              {baseline.cacheEnabled ? "on" : "off"} · database{" "}
              {baseline.database} · {baseline.databaseConnections ?? 8}{" "}
              connections · {baseline.cacheHitPercent ?? 80}% read hit rate ·{" "}
              {baseline.writePercent ?? 0}% writes.
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
            <TextExport
              text={comparisonReport(baseline, scenario)}
              filename="signal-lab-comparison.md"
              kind="comparison report"
              type="text/markdown;charset=utf-8"
            />
          </>
        )}
      </div>
    </details>
  );
}
