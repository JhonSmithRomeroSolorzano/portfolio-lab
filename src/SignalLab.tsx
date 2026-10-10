import { InvestigationGuide } from "./labs/InvestigationGuide";
import { CacheRescueLab } from "./labs/CacheRescueLab";
import type { LabSetup } from "./labs/lab-setup";
import {
  LabSettingsProvider,
  useLabSettings,
} from "./labs/LabSettingsProvider";
import { setupUrl } from "./labs/lab-setup";
import { ConcurrentWritesLab } from "./labs/ConcurrentWritesLab";
import { CacheEvictionLab } from "./labs/CacheEvictionLab";
import { RateLimitLab } from "./labs/RateLimitLab";
import { CircuitBreakerLab } from "./labs/CircuitBreakerLab";
import { EventCoalescingLab } from "./labs/EventCoalescingLab";
import { AsyncSearchLab } from "./labs/AsyncSearchLab";
import { useExpandedLab } from "./use-expanded-lab";
import { LABS } from "./lab-catalog";
import type { LabId } from "./lab-catalog";
import { LabNavigation } from "./LabNavigation";
import { labFromSearch, labUrl } from "./lab-navigation";
import { RetryExperiment } from "./RetryExperiment";
import { ServiceClientPanel } from "./ServiceClientPanel";
import { ResultAnnouncement } from "./ResultAnnouncement";
import { RequestSchedulerPanel } from "./RequestSchedulerPanel";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_SCENARIO, simulate } from "./simulation";
import type { DatabaseMode, Scenario } from "./simulation";
import { scenarioFromSearch, scenarioUrl } from "./scenario-url";
import { ShareExperiment } from "./ShareExperiment";
import { Comparison } from "./ComparisonPanel";
import { Presets } from "./ScenarioPresets";
import { ExperimentLibrary } from "./ExperimentLibrary";
import { ExperimentFiles } from "./ExperimentFiles";
import { RequestTrace } from "./RequestTrace";

import { CapacitySweepPanel } from "./CapacitySweepPanel";

import { CacheExpiryPanel } from "./CacheExpiryPanel";

import { QueueExperiment } from "./QueueExperiment";

import { Arrow } from "./Arrow";
import { GITHUB } from "./profile";
import { RequestRateInput } from "./RequestRateInput";
const REPO = `${GITHUB}/portfolio-lab`;
const labels = {
  healthy: "Within capacity",
  overloaded: "Capacity exceeded",
  degraded: "Partially available",
  unavailable: "Unavailable",
};
const explanations = {
  healthy:
    "All offered requests can be served in this model. Cached reads leave more room for requests that need fresh data.",
  overloaded:
    "Demand exceeds the connection pool’s capacity. Caching or less incoming traffic can reduce the pressure.",
  degraded:
    "The database is offline. Warm cached reads still succeed, but uncached requests time out.",
  unavailable:
    "With no successful cache hits and an offline database, every request times out. There is no fallback in this model.",
};

function SignalLab() {
  const { settings, apply, invalid } = useLabSettings();
  const [showTools, setShowTools] = useState(false);
  const { expanded, setExpanded, shell, toggle } = useExpandedLab();
  const [activeLab, setActiveLab] = useState<LabId>(() =>
    labFromSearch(window.location.search),
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const restore = () => setActiveLab(labFromSearch(window.location.search));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [activeLab]);
  function chooseLab(id: LabId) {
    if (id === activeLab) return;
    window.history.pushState(
      window.history.state,
      "",
      setupUrl(labUrl(window.location.href, id), id, settings),
    );
    setActiveLab(id);
  }
  function openSetup(setup: LabSetup) {
    apply(setup);
    window.history.pushState(
      window.history.state,
      "",
      setupUrl(labUrl(window.location.href, setup.lab), setup.lab, {
        ...settings,
        [setup.lab]: setup.settings,
      }),
    );
    setActiveLab(setup.lab);
  }
  const selectedLab = LABS.find((lab) => lab.id === activeLab)!;
  const [scenario, setScenario] = useState<Scenario>(() =>
    scenarioFromSearch(window.location.search),
  );
  const [showModel, setShowModel] = useState(false);

  useEffect(() => {
    // Coalesce rapid slider changes and avoid filling browser history.
    const timeout = window.setTimeout(() => {
      const url = scenarioUrl(window.location.href, scenario);
      if (url !== window.location.href)
        window.history.replaceState(window.history.state, "", url);
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [scenario]);

  useEffect(() => {
    const restore = () =>
      setScenario(scenarioFromSearch(window.location.search));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  // Explicit imports/restores must survive an immediate reload. Only continuous
  // slider changes use the debounced URL effect above.
  const selectScenario = (next: Scenario) => {
    const url = scenarioUrl(window.location.href, next);
    if (url !== window.location.href)
      window.history.replaceState(window.history.state, "", url);
    setScenario(next);
  };
  const result = simulate(scenario);
  const update = (change: Partial<Scenario>) =>
    setScenario((current) => ({ ...current, ...change }));
  const statusClass = result.status === "healthy" ? "good" : "warning";

  return (
    <div
      ref={shell}
      className={`lab-shell ${expanded ? "lab-expanded" : ""}`}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "Expanded Signal Lab" : undefined}
    >
      <div className="lab-topbar">
        <span>
          <span className="signal-mark" aria-hidden="true">
            ▥
          </span>{" "}
          {selectedLab.name}
        </span>
        <div className="lab-toolbar-actions">
          <button
            className="lab-more"
            aria-expanded={showTools}
            aria-controls="lab-extra-tools lab-guides"
            onClick={() => setShowTools(!showTools)}
          >
            {showTools ? "Hide extra tools" : "More experiments"}
          </button>
          <button
            className="expand-lab"
            ref={toggle}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Close expanded workspace" : "Expand workspace"}
          </button>
        </div>
      </div>
      {invalid && (
        <p className="lab-link-warning" role="status">
          The lab setup in this link is invalid or unsupported. Defaults are
          shown on first load; existing choices are kept during this visit.
        </p>
      )}
      <div id="lab-extra-tools" hidden={!showTools}>
        <LabNavigation
          active={activeLab}
          onSelect={chooseLab}
          scenario={scenario}
        />
      </div>
      <div
        ref={viewportRef}
        className="lab-viewport"
        role="region"
        aria-label="Experiment workspace"
        tabIndex={0}
      >
        <div id="lab-guides" hidden={!showTools}>
          <InvestigationGuide active={activeLab} onOpen={openSetup} />
        </div>
        <div
          className={`lab-body ${activeLab === "traffic" ? "" : "tool-mode"}`}
          hidden={!selectedLab.shared}
        >
          <div className="lab-display" hidden={activeLab !== "traffic"}>
            <div className="display-heading">
              <div>
                <span className="eyebrow dark-label">REQUEST FLOW</span>
                <h3>A small system. Real trade-offs.</h3>
              </div>
              <span className={`status ${statusClass}`}>
                <i />
                {labels[result.status]}
              </span>
            </div>
            <div
              className="flow"
              aria-label="Architecture: a browser sends requests to an API, which reads from a cache or database."
            >
              <div className="flow-node">
                <span className="node-icon">⌘</span>
                <strong>Browser</strong>
                <small>React client</small>
              </div>
              <div className="flow-wire" aria-hidden="true">
                <span />
              </div>
              <div className="flow-node">
                <span className="node-icon">{`{ }`}</span>
                <strong>API</strong>
                <small>Node.js concept</small>
              </div>
              <div className="flow-branch" aria-hidden="true">
                <span />
              </div>
              <div className="flow-stack">
                <div
                  className={`flow-node compact ${scenario.cacheEnabled ? "cache-active" : "muted-node"}`}
                >
                  <span className="compact-icon">↯</span>
                  <span>
                    <strong>Cache</strong>
                    <small>
                      {scenario.cacheEnabled
                        ? `${scenario.cacheHitPercent ?? 80}% warm-cache hits`
                        : "Bypassed"}
                    </small>
                  </span>
                  <i />
                </div>
                <div
                  className={`flow-node compact ${scenario.database === "offline" ? "database-offline" : ""}`}
                >
                  <span className="compact-icon">▤</span>
                  <span>
                    <strong>Database</strong>
                    <small>
                      {scenario.database === "offline"
                        ? "Offline"
                        : `${scenario.database === "slow" ? "400" : "80"} ms · ${scenario.databaseConnections ?? 8} connections`}
                    </small>
                  </span>
                  <i />
                </div>
              </div>
            </div>
            <div className="metrics">
              <div>
                <span>Mean response</span>
                <strong>
                  {Math.round(result.meanLatencyMs)}
                  <small> ms</small>
                </strong>
              </div>
              <div>
                <span>Successful requests</span>
                <strong>
                  {Math.round(result.successPercent)}
                  <small> %</small>
                </strong>
              </div>
              <div>
                <span>Database demand</span>
                <strong>
                  {Math.round(result.databaseDemand)}
                  <small> /s</small>
                </strong>
              </div>
            </div>
            <ResultAnnouncement
              message={`${labels[result.status]}. At ${scenario.requestsPerSecond} requests per second: mean response ${Math.round(result.meanLatencyMs)} milliseconds, ${Math.round(result.successPercent)} percent successful, database demand ${Math.round(result.databaseDemand)} per second.`}
            />
            <div className="request-budget">
              <div className="budget-label">
                <span>Where the requests go</span>
                <span>{scenario.requestsPerSecond} req/s</span>
              </div>
              <div
                className="budget-bar"
                role="img"
                aria-label={`${Math.round(result.cacheHits)} cached, ${Math.round(result.databaseServed)} database, ${Math.round(result.failed)} timed out requests per second`}
              >
                <span
                  className="cached"
                  style={{
                    width: `${(result.cacheHits / result.offered) * 100}%`,
                  }}
                />
                <span
                  className="served"
                  style={{
                    width: `${(result.databaseServed / result.offered) * 100}%`,
                  }}
                />
                <span
                  className="failed"
                  style={{
                    width: `${(result.failed / result.offered) * 100}%`,
                  }}
                />
              </div>
              <div className="legend">
                <span>
                  <i className="cached" />
                  Cache
                </span>
                <span>
                  <i className="served" />
                  Database
                </span>
                <span>
                  <i className="failed" />
                  Timeout
                </span>
              </div>
            </div>
            <p className="insight">
              <span aria-hidden="true">↳</span>
              {explanations[result.status]}
            </p>
            <button
              className="rescue-entry"
              onClick={() => {
                chooseLab("rescue");
                requestAnimationFrame(() =>
                  document
                    .getElementById("rescue-title")
                    ?.focus({ preventScroll: true }),
                );
              }}
            >
              Try Cache Rescue → What happens when everyone misses at once?
            </button>
          </div>
          <div className="lab-controls">
            <span className="eyebrow dark-label">YOU’RE AT THE CONTROLS</span>
            <div className="control-block">
              <label htmlFor="traffic">
                Incoming traffic{" "}
                <output htmlFor="traffic" aria-live="off">
                  {scenario.requestsPerSecond}
                  <small> req/s</small>
                </output>
              </label>
              <input
                id="traffic"
                type="range"
                min="1"
                max="600"
                step="1"
                value={scenario.requestsPerSecond}
                onChange={(event) =>
                  update({ requestsPerSecond: Number(event.target.value) })
                }
              />
              <div className="range-labels">
                <span>Quiet morning</span>
                <span>Rush hour</span>
              </div>
              <RequestRateInput
                value={scenario.requestsPerSecond}
                onChange={(requestsPerSecond) => update({ requestsPerSecond })}
              />
            </div>
            <div className="control-block switch-row">
              <div>
                <span id="cache-label">Read cache</span>
                <small>Serve repeated reads faster</small>
              </div>
              <button
                className={`switch ${scenario.cacheEnabled ? "on" : ""}`}
                type="button"
                role="switch"
                aria-checked={scenario.cacheEnabled}
                aria-labelledby="cache-label"
                onClick={() => update({ cacheEnabled: !scenario.cacheEnabled })}
              >
                <span />
              </button>
            </div>
            <fieldset className="control-block">
              <legend>Database condition</legend>
              <div className="segmented">
                {(["normal", "slow", "offline"] as DatabaseMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={scenario.database === mode}
                      onClick={() => update({ database: mode })}
                    >
                      {mode === "normal"
                        ? "Normal"
                        : mode === "slow"
                          ? "Slow"
                          : "Offline"}
                    </button>
                  ),
                )}
              </div>
            </fieldset>
            <details className="advanced-controls">
              <summary>
                More workload settings
                <small>
                  {scenario.cacheHitPercent ?? 80}% read hits ·{" "}
                  {scenario.databaseConnections ?? 8} connections ·{" "}
                  {scenario.writePercent ?? 0}% writes
                </small>
              </summary>
              <div className="advanced-body">
                <div className="control-block">
                  <label htmlFor="cache-rate">
                    Cache hit rate{" "}
                    <output htmlFor="cache-rate" aria-live="off">
                      {scenario.cacheHitPercent ?? 80}%
                    </output>
                  </label>
                  <input
                    id="cache-rate"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    disabled={!scenario.cacheEnabled}
                    value={scenario.cacheHitPercent ?? 80}
                    onChange={(event) =>
                      update({ cacheHitPercent: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="control-block">
                  <label htmlFor="pool-size">
                    Database pool{" "}
                    <output htmlFor="pool-size" aria-live="off">
                      {scenario.databaseConnections ?? 8} connections
                    </output>
                  </label>
                  <input
                    id="pool-size"
                    type="range"
                    min="1"
                    max="32"
                    step="1"
                    value={scenario.databaseConnections ?? 8}
                    disabled={scenario.database === "offline"}
                    onChange={(event) =>
                      update({
                        databaseConnections: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="control-block">
                  <label htmlFor="write-share">
                    Write requests{" "}
                    <output htmlFor="write-share" aria-live="off">
                      {scenario.writePercent ?? 0}%
                    </output>
                  </label>
                  <input
                    id="write-share"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={scenario.writePercent ?? 0}
                    onChange={(event) =>
                      update({ writePercent: Number(event.target.value) })
                    }
                  />
                  <small>Writes always bypass the read cache.</small>
                </div>
              </div>
            </details>
            <ShareExperiment
              key={JSON.stringify(scenario)}
              scenario={scenario}
            />
            <button
              className="reset-button"
              type="button"
              onClick={() => selectScenario({ ...DEFAULT_SCENARIO })}
            >
              ↺ Reset the experiment
            </button>
            <p className="model-note">
              A browser-only model with explicit assumptions. No live services
              or production measurements.
            </p>
          </div>
        </div>
        <div className="experiment-tools">
          <div hidden={activeLab !== "rescue"}>
            <CacheRescueLab active={activeLab === "rescue"} />
          </div>
          <div hidden={activeLab !== "writes"}>
            <ConcurrentWritesLab active={activeLab === "writes"} />
          </div>
          <div hidden={activeLab !== "eviction"}>
            <CacheEvictionLab active={activeLab === "eviction"} />
          </div>
          <div hidden={activeLab !== "rate-limit"}>
            <RateLimitLab active={activeLab === "rate-limit"} />
          </div>
          <div hidden={activeLab !== "circuit"}>
            <CircuitBreakerLab active={activeLab === "circuit"} />
          </div>
          <div hidden={activeLab !== "events"}>
            <EventCoalescingLab active={activeLab === "events"} />
          </div>
          <div hidden={activeLab !== "search"}>
            <AsyncSearchLab active={activeLab === "search"} />
          </div>
          <div hidden={activeLab !== "presets"}>
            <Presets onSelect={selectScenario} />
          </div>
          <div hidden={activeLab !== "compare"}>
            <Comparison scenario={scenario} onSelect={selectScenario} />
          </div>
          <div hidden={activeLab !== "sweep"}>
            <CapacitySweepPanel scenario={scenario} />
          </div>
          <div hidden={activeLab !== "cache"}>
            <CacheExpiryPanel />
          </div>
          <div hidden={activeLab !== "queue"}>
            <QueueExperiment />
          </div>
          <div hidden={activeLab !== "requests"}>
            <RequestSchedulerPanel />
          </div>
          <div hidden={activeLab !== "retries"}>
            <RetryExperiment />
          </div>
          <div hidden={activeLab !== "trace"}>
            <RequestTrace key={JSON.stringify(scenario)} scenario={scenario} />
          </div>
          <div hidden={activeLab !== "library"}>
            <ExperimentLibrary scenario={scenario} onSelect={selectScenario} />
          </div>
          <div hidden={activeLab !== "files"}>
            <ExperimentFiles scenario={scenario} onSelect={selectScenario} />
          </div>
          <div hidden={activeLab !== "api"}>
            <ServiceClientPanel scenario={scenario} />
          </div>
        </div>
        <div className="lab-bottom" hidden={activeLab !== "traffic"}>
          <button
            type="button"
            aria-expanded={showModel}
            aria-controls="model-details"
            onClick={() => setShowModel(!showModel)}
          >
            {showModel ? "−" : "+"} Under the hood
          </button>
          <a
            href={`${REPO}/blob/main/src/simulation.ts`}
            target="_blank"
            rel="noreferrer"
          >
            Explore the model <Arrow diagonal />
          </a>
        </div>
        {showModel && activeLab === "traffic" && (
          <div id="model-details" className="model-details">
            <p>
              Each request adds 12 ms of API overhead. With caching enabled,{" "}
              {scenario.cacheHitPercent ?? 80}% of reads hit a warm cache in 8
              ms. Uncached reads and all writes share{" "}
              {scenario.databaseConnections ?? 8} database connections: 80 ms
              per read normally, 400 ms when slow. Reads and writes have the
              same modeled database cost. Database capacity is connections ×
              1,000 ÷ latency. Requests above that capacity, or to an offline
              database, time out after 1,000 ms.
            </p>
            <p>
              The mean includes successes and timeouts. This steady-state model
              has no queue, retries, cache expiry, or network variance. Its
              purpose is to make the trade-offs visible; it does not predict
              production performance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignalExperiment() {
  return (
    <LabSettingsProvider>
      <SignalLab />
    </LabSettingsProvider>
  );
}
