import { ToolPanel } from "./ToolPanel";
import { baselineFromSearch, clearComparisonUrl } from "./comparison-link";
import { ShareComparison } from "./ShareComparison";
import { ComparisonFiles } from "./ComparisonFiles";
import { TextExport } from "./TextExport";
import { comparisonReport } from "./comparison-report";
import { loadBaseline, saveBaseline } from "./comparison-storage";
import { useRef, useState } from "react";
import {
  compareScenarios,
  signed,
} from "../../src/domain/simulation/comparison";
import type { Scenario } from "../../src/domain/simulation/simulation";

export function Comparison({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (value: Scenario) => void;
}) {
  const captureRef = useRef<HTMLButtonElement>(null);
  const [shared] = useState(() => baselineFromSearch(window.location.search));
  const [baseline, setBaseline] = useState<Scenario | null>(
    () => shared ?? loadBaseline(),
  );
  const [notice, setNotice] = useState(
    "Your baseline is saved only in this browser.",
  );
  function capture(value: Scenario | null) {
    setBaseline(value);
    window.history.replaceState(
      window.history.state,
      "",
      clearComparisonUrl(window.location.href),
    );
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
    <ToolPanel title="Compare two setups">
      <div className="tool-content">
        <p>
          Capture a baseline, then change the controls above. Differences below
          are current minus baseline.
        </p>
        <div className="tool-actions">
          <button ref={captureRef} onClick={() => capture({ ...scenario })}>
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
              <button
                onClick={() => {
                  capture(null);
                  captureRef.current?.focus();
                }}
              >
                Clear baseline
              </button>
            </>
          )}
        </div>
        <p role="status">{notice}</p>
        <ComparisonFiles
          value={baseline ? { baseline, current: scenario } : null}
          onImport={(pair) => {
            capture(pair.baseline);
            onSelect(pair.current);
          }}
        />
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
            <ShareComparison
              key={JSON.stringify([baseline, scenario])}
              baseline={baseline}
              current={scenario}
            />
            <TextExport
              text={comparisonReport(baseline, scenario)}
              filename="signal-lab-comparison.md"
              kind="comparison report"
              type="text/markdown;charset=utf-8"
            />
          </>
        )}
      </div>
    </ToolPanel>
  );
}
