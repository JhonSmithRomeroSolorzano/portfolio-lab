import { ToolPanel } from "./ToolPanel";
import { capacityHeadroom } from "./capacity-headroom";
import type { Scenario } from "./simulation";
import { capacitySweep, sweepCsv } from "./capacity-sweep";
import { TextExport } from "./TextExport";
export function CapacitySweepPanel({ scenario }: { scenario: Scenario }) {
  const rows = capacitySweep(scenario);
  const headroom = capacityHeadroom(scenario);
  const firstFailure = rows.find((r) => r.failed > 0);
  const points = rows
    .map(
      (r) => `${(r.offered / 600) * 480},${160 - (r.successful / 600) * 160}`,
    )
    .join(" ");
  return (
    <ToolPanel title="Sweep traffic and find capacity">
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
        <div className="tool-metrics" aria-live="polite">
          <div>
            <span>Whole-request capacity</span>
            <strong>
              {headroom.maximumTraffic === null
                ? "All reads cached"
                : `${headroom.maximumTraffic} /s`}
            </strong>
          </div>
          <div>
            <span>Spare database capacity</span>
            <strong>{headroom.spareDatabaseCapacity.toFixed(1)} /s</strong>
          </div>
          <div>
            <span>Connections needed at this load</span>
            <strong>
              {headroom.minimumConnections === null
                ? "Database offline"
                : headroom.minimumConnections}
            </strong>
          </div>
        </div>
        <p>
          {headroom.allReadsCached
            ? "This modeled workload never reaches the database. It does not imply unlimited real capacity."
            : "The analytical boundary complements the sampled chart. A negative spare capacity means database demand exceeds capacity."}{" "}
          {headroom.minimumConnections !== null &&
            headroom.minimumConnections > 32 &&
            "The required connection count exceeds the control’s 32-connection limit."}
        </p>
        <div className="sweep-chart" aria-hidden="true">
          <svg viewBox="0 0 480 160">
            <path
              d="M16 154.667 L480 0"
              stroke="var(--lab-muted)"
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--signal)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span>
            20 → 600 incoming req/s · Solid blue: successful · Dashed: offered
          </span>
        </div>
        <TextExport
          text={sweepCsv(scenario)}
          filename="signal-lab-capacity.csv"
          kind="capacity CSV"
          type="text/csv"
        />
        <details>
          <summary>Read all 30 samples</summary>
          <div
            className="table-scroll"
            role="region"
            aria-label="Capacity sweep samples"
            tabIndex={0}
          >
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
    </ToolPanel>
  );
}
