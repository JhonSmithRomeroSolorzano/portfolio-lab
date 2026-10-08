import { RetryDistribution } from "./labs/RetryDistribution";
import { ToolPanel } from "./ToolPanel";
import { useState } from "react";
import { retryExperiment } from "./retry-model";
export function RetryExperiment() {
  const [retries, setRetries] = useState(3),
    [budget, setBudget] = useState(24),
    [delay, setDelay] = useState(100),
    [jitter, setJitter] = useState(false),
    [recovery, setRecovery] = useState(500);
  const rows = retryExperiment({
    retries,
    budget,
    baseDelayMs: delay,
    recoveryMs: recovery,
    jitter,
    seed: 42,
  });
  const successes = rows.filter((r) => r.outcome === "success").length;
  const buckets = new Map<number, number>();
  for (const row of rows) {
    const b = Math.floor(row.at / 100);
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  return (
    <ToolPanel title="Explore retries, backoff, and jitter">
      <div className="tool-content">
        <p>
          Eight requests start together. Attempts fail instantly until the
          outage ends; after recovery they succeed instantly. Retries use
          exponential backoff and a shared budget. Optional full jitter uses a
          fixed seed (42) so the experiment is reproducible. This separate model
          has no service capacity, network delay, or request deadlines.
        </p>
        <label htmlFor="retry-limit">
          Maximum retries per request: {retries}
        </label>
        <input
          className="tool-range"
          id="retry-limit"
          type="range"
          min="0"
          max="5"
          value={retries}
          onChange={(e) => setRetries(Number(e.target.value))}
        />
        <label htmlFor="retry-budget">Shared retry budget: {budget}</label>
        <input
          className="tool-range"
          id="retry-budget"
          type="range"
          min="0"
          max="40"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
        <label htmlFor="retry-delay">Initial backoff: {delay} ms</label>
        <input
          className="tool-range"
          id="retry-delay"
          type="range"
          min="10"
          max="500"
          step="10"
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
        />
        <label htmlFor="retry-recovery">
          Service recovers at: {recovery} ms
        </label>
        <input
          className="tool-range"
          id="retry-recovery"
          type="range"
          min="0"
          max="5000"
          step="100"
          value={recovery}
          onChange={(e) => setRecovery(Number(e.target.value))}
        />
        <label className="tool-actions">
          <input
            type="checkbox"
            checked={jitter}
            onChange={(e) => setJitter(e.target.checked)}
          />{" "}
          Spread retries with seeded full jitter
        </label>
        <div className="tool-metrics" aria-live="polite">
          <div>
            <span>Successful requests</span>
            <strong>{successes} / 8</strong>
          </div>
          <div>
            <span>Total attempts</span>
            <strong>
              {rows.length} ({(rows.length / 8).toFixed(1)}×)
            </strong>
          </div>
          <div>
            <span>Peak attempts per 100 ms</span>
            <strong>{Math.max(...buckets.values())}</strong>
          </div>
        </div>
        <p>
          {rows.length - 8} retries used; {8 - successes} requests ended without
          success. Jitter spreads attempts, but can consume a budget before
          recovery; it does not guarantee success.
        </p>
        <RetryDistribution
          plain={
            jitter
              ? retryExperiment({
                  retries,
                  budget,
                  baseDelayMs: delay,
                  recoveryMs: recovery,
                  jitter: false,
                  seed: 42,
                })
              : rows
          }
          jitter={
            jitter
              ? rows
              : retryExperiment({
                  retries,
                  budget,
                  baseDelayMs: delay,
                  recoveryMs: recovery,
                  jitter: true,
                  seed: 42,
                })
          }
          recovery={recovery}
        />
        <div
          className="table-scroll"
          role="region"
          aria-label="Retry attempts"
          tabIndex={0}
        >
          <table className="tool-table">
            <caption>
              Attempts in time order; initial requests do not consume retry
              budget
            </caption>
            <thead>
              <tr>
                {["Request", "Attempt", "Time", "Outcome", "Next attempt"].map(
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
                <tr key={`${r.request}-${r.attempt}`}>
                  <th scope="row">{r.request}</th>
                  <td>{r.attempt}</td>
                  <td>{r.at} ms</td>
                  <td>{r.outcome}</td>
                  <td>{r.nextAt === null ? "—" : `${r.nextAt} ms`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolPanel>
  );
}
