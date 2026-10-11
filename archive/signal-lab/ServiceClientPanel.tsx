import { ToolPanel } from "./ToolPanel";
import { useEffect, useRef, useState } from "react";
import {
  runServiceScenario,
  sameScenario,
  ServiceError,
} from "./service-client";
import type { ServiceResult } from "./service-client";
import type { Scenario } from "../../src/domain/simulation/simulation";

export function ServiceClientPanel({ scenario }: { scenario: Scenario }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Select the local API, then send the current setup when you’re ready.",
  );
  const [reply, setReply] = useState<
    (ServiceResult & { scenario: Scenario }) | null
  >(null);
  const request = useRef<AbortController | null>(null);
  const runButton = useRef<HTMLButtonElement>(null);
  const current = useRef(scenario);
  current.current = scenario;
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (request.current) {
      request.current.abort();
      request.current = null;
      setBusy(false);
      setMessage("Setup changed. Send the new setup when ready.");
    }
  }, [scenario]);
  async function run() {
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    const sent = { ...scenario };
    setReply(null);
    setBusy(true);
    setMessage("Waiting for the local API…");
    try {
      const result = await runServiceScenario(sent, {
        signal: controller.signal,
      });
      if (
        request.current !== controller ||
        !sameScenario(current.current, sent)
      )
        return;
      setReply({ ...result, scenario: sent });
      setMessage("API result verified against this browser’s model.");
    } catch (error) {
      if (request.current !== controller) return;
      setMessage(
        error instanceof ServiceError
          ? `${error.message}${error.requestId ? ` Request ID: ${error.requestId}.` : ""}`
          : "Could not complete the request. Try again.",
      );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  const stale = reply && !sameScenario(reply.scenario, scenario);
  return (
    <ToolPanel title="Verify with the local API">
      <div className="tool-content service-client">
        <p>
          Send a setup through the Node HTTP service and verify that its result
          agrees with the browser. Both calculate the same illustrative model.
        </p>
        <p>
          From the repository, run <code>npm run api</code> and{" "}
          <code>npm run dev</code> in separate terminals. The default API port
          is 3001.
        </p>
        {import.meta.env.DEV ? (
          <>
            <fieldset className="service-mode">
              <legend>Calculation mode</legend>
              <label>
                <input
                  type="radio"
                  name="calculation-mode"
                  checked={!enabled}
                  onChange={() => {
                    request.current?.abort();
                    request.current = null;
                    setBusy(false);
                    setEnabled(false);
                    setReply(null);
                    setMessage(
                      "Browser mode selected. No API requests will be sent.",
                    );
                  }}
                />{" "}
                Browser only
              </label>
              <label>
                <input
                  type="radio"
                  name="calculation-mode"
                  checked={enabled}
                  onChange={() => setEnabled(true)}
                />{" "}
                Browser + local API check
              </label>
            </fieldset>
            {enabled && (
              <div className="tool-actions">
                <button
                  ref={runButton}
                  aria-disabled={busy}
                  onClick={() => {
                    if (!busy) void run();
                  }}
                >
                  {busy ? "Waiting for API…" : "Send current setup"}
                </button>
                {busy && (
                  <button
                    onClick={() => {
                      request.current?.abort();
                      request.current = null;
                      setBusy(false);
                      setMessage(
                        "API request cancelled. Browser results are still available.",
                      );
                      requestAnimationFrame(() => runButton.current?.focus());
                    }}
                  >
                    Cancel API request
                  </button>
                )}
              </div>
            )}
            <p role="status" aria-atomic="true">
              {message}
            </p>
            {reply && (
              <div className="service-result" aria-label="Local API result">
                <p>
                  <strong>
                    {stale
                      ? "Previous setup — send again to verify your changes."
                      : "The API and browser agree."}
                  </strong>
                </p>
                <dl>
                  <div>
                    <dt>Verified setup</dt>
                    <dd>
                      {reply.scenario.requestsPerSecond} req/s · cache{" "}
                      {reply.scenario.cacheEnabled ? "on" : "off"} · database{" "}
                      {reply.scenario.database}
                    </dd>
                  </div>
                  <div>
                    <dt>Modeled mean response</dt>
                    <dd>{reply.result.meanLatencyMs.toFixed(1)} ms</dd>
                  </div>
                  <div>
                    <dt>Successful requests</dt>
                    <dd>{reply.result.successPercent.toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt>HTTP round trip</dt>
                    <dd>{reply.roundTripMs.toFixed(1)} ms</dd>
                  </div>
                  {reply.requestId && (
                    <div>
                      <dt>Request ID</dt>
                      <dd>
                        <code>{reply.requestId}</code>
                      </dd>
                    </div>
                  )}
                </dl>
                <p>
                  The round trip measures this HTTP request, including local
                  processing. It is separate from the modeled response time
                  above.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="service-result">
            This hosted demo uses browser calculations. API checking is
            available in the local development app; this page does not contact
            your computer.
          </p>
        )}
        <a
          className="text-link"
          href="https://github.com/JhonSmithRomeroSolorzano/portfolio-lab/blob/main/server/README.md"
          target="_blank"
          rel="noreferrer"
        >
          Local setup and API contract ↗
        </a>
      </div>
    </ToolPanel>
  );
}
