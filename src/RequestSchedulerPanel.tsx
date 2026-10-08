import { useState } from "react";
import { scheduleRequests, SCHEDULER_ARRIVALS } from "./request-scheduler";
export function RequestSchedulerPanel() {
  const [concurrency, setConcurrency] = useState(2),
    [serviceMs, setServiceMs] = useState(100),
    [buffer, setBuffer] = useState(8);
  const rows = scheduleRequests({ concurrency, serviceMs, buffer });
  const served = rows.filter((r) => r.outcome === "served");
  const meanWait = served.length
    ? served.reduce((n, r) => n + r.startedAt! - r.arrivedAt, 0) / served.length
    : 0;
  return (
    <details className="tool-panel">
      <summary>Inspect request wait and service times</summary>
      <div className="tool-content">
        <p>
          A separate FIFO scheduler for {rows.length} requests arriving at{" "}
          {SCHEDULER_ARRIVALS.join(", ")} ms. Workers run one request at a time
          with fixed service duration. Completion and queued work take priority
          over new arrivals at the same instant. The waiting buffer excludes
          running requests; overflow rejects new arrivals. This is a
          deterministic illustration, not a production measurement.
        </p>
        <label htmlFor="scheduler-workers">Workers: {concurrency}</label>
        <input
          id="scheduler-workers"
          className="tool-range"
          type="range"
          min="1"
          max="8"
          value={concurrency}
          onChange={(e) => setConcurrency(Number(e.target.value))}
        />
        <label htmlFor="scheduler-service">
          Service duration: {serviceMs} ms
        </label>
        <input
          id="scheduler-service"
          className="tool-range"
          type="range"
          min="10"
          max="1000"
          step="10"
          value={serviceMs}
          onChange={(e) => setServiceMs(Number(e.target.value))}
        />
        <label htmlFor="scheduler-buffer">Waiting slots: {buffer}</label>
        <input
          id="scheduler-buffer"
          className="tool-range"
          type="range"
          min="0"
          max="40"
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value))}
        />
        <div className="tool-metrics" aria-live="polite">
          <div>
            <span>Completed</span>
            <strong>{served.length}</strong>
          </div>
          <div>
            <span>Rejected</span>
            <strong>{rows.length - served.length}</strong>
          </div>
          <div>
            <span>Mean wait, served only</span>
            <strong>{meanWait.toFixed(1)} ms</strong>
          </div>
        </div>
        <div className="table-scroll">
          <table className="tool-table">
            <caption>Every request through completion or rejection</caption>
            <thead>
              <tr>
                {[
                  "Request",
                  "Arrival",
                  "Start",
                  "Finish",
                  "Wait",
                  "Outcome",
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.id}</th>
                  <td>{r.arrivedAt} ms</td>
                  <td>{r.startedAt === null ? "—" : `${r.startedAt} ms`}</td>
                  <td>{r.finishedAt} ms</td>
                  <td>
                    {r.startedAt === null
                      ? "—"
                      : `${r.startedAt - r.arrivedAt} ms`}
                  </td>
                  <td>{r.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
