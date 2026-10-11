import { ToolPanel } from "./ToolPanel";
import { useState } from "react";
import {
  queueTimeline,
  queueRecovery,
  QUEUE_PROFILES,
} from "../../src/domain/simulation/queue-model";
export function QueueExperiment() {
  const [profile, setProfile] = useState("burst");
  const arrivals = QUEUE_PROFILES.find((p) => p.id === profile)!.arrivals;
  const [capacity, setCapacity] = useState(8);
  const [buffer, setBuffer] = useState(16);
  const [showRecovery, setShowRecovery] = useState(false);
  const initial = queueTimeline(capacity, buffer, arrivals);
  const rows = showRecovery
    ? queueRecovery(capacity, buffer, arrivals)
    : initial;
  const end = rows[rows.length - 1];
  const unbuffered = queueTimeline(capacity, 0, arrivals).at(-1)!;
  return (
    <ToolPanel title="Absorb a burst with a bounded queue">
      <div className="tool-content">
        <p>
          A separate eight-second experiment. Each workload offers 64 requests,
          distributed as {arrivals.join(", ")} arrivals. Each tick serves old
          backlog first, then new arrivals. Remaining work enters a bounded
          queue; overflow rejects the newest arrivals. No retries or request
          deadlines are modeled. Queued work is waiting, not successful.
        </p>
        <label htmlFor="queue-profile">Arrival pattern</label>
        <select
          id="queue-profile"
          className="tool-input"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
        >
          {QUEUE_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
        <label className="tool-actions">
          <input
            type="checkbox"
            checked={showRecovery}
            onChange={(e) => setShowRecovery(e.target.checked)}
          />
          Continue until the accepted queue is empty
        </label>
        <p>
          The arrival window ends after {arrivals.length}s with{" "}
          {initial.at(-1)!.queued} waiting requests. Draining that backlog takes{" "}
          {Math.ceil(initial.at(-1)!.queued / capacity)} more seconds with no
          new arrivals.
        </p>
        <div className="tool-metrics" aria-live="polite">
          <div>
            <span>Served after {end.second}s</span>
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
        <div
          className="table-scroll"
          role="region"
          aria-label="Queue timeline"
          tabIndex={0}
        >
          <table className="tool-table">
            <caption>
              Queue timeline —{" "}
              {showRecovery ? "including recovery" : "arrival window"}, one row
              per second
            </caption>
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
    </ToolPanel>
  );
}
