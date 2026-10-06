import { useState } from "react";
import { cacheTimeline } from "./cache-expiry";
export function CacheExpiryPanel() {
  const [ttl, setTtl] = useState(8);
  const [step, setStep] = useState(0);
  const rows = cacheTimeline(ttl);
  const visible = rows.slice(0, step + 1);
  const current = rows[step];
  return (
    <details className="tool-panel">
      <summary>Explore cache expiry and stale reads</summary>
      <div className="tool-content">
        <p>
          A separate single-key experiment: one read per second for 21 seconds.
          The origin changes from version 1 to version 2 just before the read at
          5s. Cache misses fetch and store the current version. A hit does not
          extend expiry; there is no invalidation or background refresh.
        </p>
        <label htmlFor="ttl">Cache TTL: {ttl} seconds</label>
        <input
          className="tool-range"
          id="ttl"
          type="range"
          min="1"
          max="12"
          step="1"
          value={ttl}
          onChange={(e) => {
            setTtl(Number(e.target.value));
            setStep(0);
          }}
        />
        <div className="tool-actions">
          <button disabled={step === 20} onClick={() => setStep((s) => s + 1)}>
            Read next second
          </button>
          <button disabled={step === 20} onClick={() => setStep(20)}>
            Run all 21 reads
          </button>
          <button disabled={step === 0} onClick={() => setStep(0)}>
            Restart expiry experiment
          </button>
        </div>
        <p aria-live="polite">
          At {current.second}s: {current.source} returns version{" "}
          {current.returnedVersion}.{" "}
          {current.stale
            ? "This response is stale."
            : "This response is fresh."}{" "}
          Cache expires at {current.expiresAt}s.
        </p>
        <div className="tool-metrics">
          <div>
            <span>Cache hits so far</span>
            <strong>
              {visible.filter((r) => r.source === "cache").length}
            </strong>
          </div>
          <div>
            <span>Database reads</span>
            <strong>
              {visible.filter((r) => r.source === "database").length}
            </strong>
          </div>
          <div>
            <span>Stale responses</span>
            <strong>{visible.filter((r) => r.stale).length}</strong>
          </div>
        </div>
        <div className="table-scroll">
          <table className="tool-table">
            <caption>Expiry timeline — reads shown so far</caption>
            <thead>
              <tr>
                <th scope="col">Second</th>
                <th scope="col">Source</th>
                <th scope="col">Version</th>
                <th scope="col">Freshness</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.second}>
                  <th scope="row">{r.second}s</th>
                  <td>{r.source}</td>
                  <td>{r.returnedVersion}</td>
                  <td>{r.stale ? "Stale" : "Fresh"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
