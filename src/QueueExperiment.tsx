import { useState } from "react";
import { queueTimeline } from "./queue-model";
export function QueueExperiment() {
  const [capacity, setCapacity] = useState(8);
  const [buffer, setBuffer] = useState(16);
  const rows = queueTimeline(capacity, buffer);
  const end = rows[rows.length - 1];
  const unbuffered = queueTimeline(capacity, 0).at(-1)!;
  return (
    <details className="tool-panel">
      <summary>Absorb a burst with a bounded queue</summary>
      <div className="tool-content">
        <p>
          A separate eight-second experiment with 4, 4, 20, 20, 4, 4, 4, 4
          arrivals. Each tick serves old backlog first, then new arrivals.
          Remaining work enters a bounded queue; overflow rejects the newest
          arrivals. No retries or request deadlines are modeled. Queued work is
          waiting, not successful.
        </p>
        <label htmlFor="queue-capacity">
          Service capacity: {capacity} requests per tick
        </label>
        <input
          className="tool-range"
          id="queue-capacity"
          type="range"
          min="1"
          max="16"
          step="1"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <label htmlFor="queue-buffer">Waiting buffer: {buffer} requests</label>
        <input
          className="tool-range"
          id="queue-buffer"
          type="range"
          min="0"
          max="40"
          step="1"
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value))}
        />
        <div className="tool-metrics" aria-live="polite">
          <div>
            <span>Served after 8s</span>
            <strong>{end.totalServed}</strong>
          </div>
          <div>
            <span>Still queued</span>
            <strong>{end.queued}</strong>
          </div>
          <div>
            <span>Rejected</span>
            <strong>{end.totalRejected}</strong>
          </div>
        </div>
        <p>
          Without a buffer, the same burst rejects {unbuffered.totalRejected}{" "}
          requests. Here, {end.totalServed} served + {end.queued} waiting +{" "}
          {end.totalRejected} rejected = {end.totalArrived} offered.
        </p>
        <div className="table-scroll">
          <table className="tool-table">
            <caption>Burst timeline, one row per second</caption>
            <thead>
              <tr>
                {["Second", "Arrivals", "Served", "Waiting", "Rejected"].map(
                  (h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.second}>
                  <th scope="row">{r.second}</th>
                  <td>{r.incoming}</td>
                  <td>{r.served}</td>
                  <td>{r.queued}</td>
                  <td>{r.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
