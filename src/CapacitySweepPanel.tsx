import type { Scenario } from "./simulation";
import { capacitySweep, sweepCsv } from "./capacity-sweep";
import { downloadText } from "./experiment-file";
export function CapacitySweepPanel({ scenario }: { scenario: Scenario }) {
  const rows = capacitySweep(scenario);
  const firstFailure = rows.find((r) => r.failed > 0);
  const points = rows
    .map(
      (r) => `${(r.offered / 600) * 480},${160 - (r.successful / 600) * 160}`,
    )
    .join(" ");
  return (
    <details className="tool-panel">
      <summary>Sweep traffic and find capacity</summary>
      <div className="tool-content">
        <p>
          Hold your cache and database settings fixed while increasing traffic
          from 20 to 600 req/s. Samples are 20 req/s apart; the precise boundary
          can fall between them.
        </p>
        <p>
          {firstFailure
            ? `The first sample with failures is ${firstFailure.offered} req/s.`
            : "Every sampled load fits within this setup’s capacity."}
        </p>
        <div className="sweep-chart" aria-hidden="true">
          <svg viewBox="0 0 480 160">
            <path
              d="M16 154.667 L480 0"
              stroke="#829583"
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#c3f879"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span>
            20 → 600 incoming req/s · Green: successful · Dashed: offered
          </span>
        </div>
        <div className="tool-actions">
          <button
            type="button"
            onClick={() =>
              downloadText(
                sweepCsv(scenario),
                "signal-lab-capacity.csv",
                "text/csv",
              )
            }
          >
            Download capacity CSV
          </button>
        </div>
        <details>
          <summary>Read all 30 samples</summary>
          <div className="table-scroll">
            <table className="tool-table">
              <caption>
                Modeled traffic sweep, holding all other settings fixed
              </caption>
              <thead>
                <tr>
                  <th scope="col">Offered /s</th>
                  <th scope="col">Successful /s</th>
                  <th scope="col">Failed /s</th>
                  <th scope="col">Mean ms</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.offered}>
                    <th scope="row">{r.offered}</th>
                    <td>{r.successful.toFixed(1)}</td>
                    <td>{r.failed.toFixed(1)}</td>
                    <td>{r.meanLatencyMs.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </details>
  );
}
