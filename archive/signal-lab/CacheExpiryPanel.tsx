import { ToolPanel } from "./ToolPanel";
import { TextExport } from "./TextExport";
import { cacheTimelineCsv } from "./cache-export";
import { useState } from "react";
import {
  cacheTimeline,
  compareCachePolicies,
} from "../../src/domain/simulation/cache-expiry";
import type { CachePolicy } from "../../src/domain/simulation/cache-expiry";
export function CacheExpiryPanel() {
  const [policy, setPolicy] = useState<CachePolicy>("ttl");
  const [ttl, setTtl] = useState(8);
  const [step, setStep] = useState(0);
  const rows = cacheTimeline(ttl, policy);
  const visible = rows.slice(0, step + 1);
  const current = rows[step];
  return (
    <ToolPanel title="Explore cache expiry and stale reads">
      <div className="tool-content">
        <p>
          A separate single-key experiment: one read per second for 21 seconds.
          The origin changes from version 1 to version 2 just before the read at
          5s. A hit does not extend expiry. Fixed TTL waits for expiration;
          invalidation expires the entry at the origin update.
          Stale-while-revalidate serves an expired entry and fetches its
          replacement in the background, completing before the next second’s
          read. Fetches capture the version when they start. This model assumes
          successful fetches and no network variance.
        </p>
        <label htmlFor="cache-policy">Cache strategy</label>
        <select
          id="cache-policy"
          className="tool-input"
          value={policy}
          onChange={(e) => {
            setPolicy(e.target.value as CachePolicy);
            setStep(0);
          }}
        >
          <option value="ttl">Fixed TTL</option>
          <option value="invalidate">Invalidate on update</option>
          <option value="swr">Stale-while-revalidate</option>
        </select>
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
          Cache expires at {current.expiresAt}s.{" "}
          {current.refreshing &&
            "A background refresh completes before the next read."}
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
              {visible.reduce((sum, r) => sum + r.originReads, 0)}
            </strong>
          </div>
          <div>
            <span>Stale responses</span>
            <strong>{visible.filter((r) => r.stale).length}</strong>
          </div>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Cache strategy comparison"
          tabIndex={0}
        >
          <table className="tool-table">
            <caption>
              Strategy comparison — all 21 reads at the selected TTL
            </caption>
            <thead>
              <tr>
                <th scope="col">Strategy</th>
                <th scope="col">Origin fetches</th>
                <th scope="col">Blocking reads</th>
                <th scope="col">Stale responses</th>
              </tr>
            </thead>
            <tbody>
              {compareCachePolicies(ttl).map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    {row.name}
                    {policy === row.id ? " (selected)" : ""}
                  </th>
                  <td>{row.originReads}</td>
                  <td>{row.blockingReads}</td>
                  <td>{row.staleResponses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TextExport
          text={cacheTimelineCsv(ttl, policy)}
          filename="signal-lab-cache-timeline.csv"
          kind="cache timeline CSV"
          type="text/csv;charset=utf-8"
        />
        <p>
          Background refresh reduces blocking reads, but can serve stale data.
          Invalidation assumes the update reliably reaches the cache.
        </p>
        <div
          className="table-scroll"
          role="region"
          aria-label="Cache read timeline"
          tabIndex={0}
        >
          <table className="tool-table">
            <caption>Expiry timeline — reads shown so far</caption>
            <thead>
              <tr>
                <th scope="col">Second</th>
                <th scope="col">Source</th>
                <th scope="col">Version</th>
                <th scope="col">Freshness</th>
                <th scope="col">Origin fetch</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.second}>
                  <th scope="row">{r.second}s</th>
                  <td>{r.source}</td>
                  <td>{r.returnedVersion}</td>
                  <td>{r.stale ? "Stale" : "Fresh"}</td>
                  <td>
                    {r.refreshing
                      ? "Background"
                      : r.originReads
                        ? "Blocking"
                        : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolPanel>
  );
}
