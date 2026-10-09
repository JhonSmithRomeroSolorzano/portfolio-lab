import { InvestigationGuide } from "./labs/InvestigationGuide";
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
import "./labs.css";
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

import { observeScrollReveals } from "./scroll-reveals";
import { observePortfolioMotion } from "./portfolio-motion";
import { StackMap } from "./StackMap";
import { TechnologyOverview } from "./TechnologyOverview";
import { ResumeSection } from "./ResumeSection";
import { LINKEDIN } from "./profile";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandMark } from "./BrandMark";
import { RoutePuzzle } from "./play/RoutePuzzle";
import { MotionStudio } from "./play/MotionStudio";

import { RequestRateInput } from "./RequestRateInput";

const GITHUB = "https://github.com/JhonSmithRomeroSolorzano";
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

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"} />
    </svg>
  );
}

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

export function App() {
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(
    () => (mainRef.current ? observeScrollReveals(mainRef.current) : undefined),
    [],
  );
  useEffect(() => {
    if (mainRef.current && navRef.current) {
      return observePortfolioMotion(mainRef.current, navRef.current);
    }
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="portfolio-frame">
        <span className="reading-progress" aria-hidden="true" />
        <header className="identity-rail">
          <a
            className="rail-brand"
            href="#"
            aria-label="Jhon Smith Romero, home"
          >
            <BrandMark />
            <span>
              Jhon Smith
              <br />
              <strong>Romero</strong>
            </span>
          </a>
          <p className="rail-caption">
            ENGINEERING
            <br />
            PORTFOLIO
          </p>
          <nav aria-label="Main navigation" ref={navRef}>
            <span className="nav-cursor" aria-hidden="true" />
            <a href="#workbench">
              <span aria-hidden="true">⌘</span> Overview
            </a>
            <a href="#resume">
              <span aria-hidden="true">↗</span> Résumé
            </a>
            <a href="#contact">
              <span aria-hidden="true">@</span> Contact
            </a>
            <a href="#lab">
              <span aria-hidden="true">↯</span> Labs & play
            </a>
          </nav>
          <div className="rail-bottom">
            <p>
              Based in Pereira,
              <br />
              Colombia.
            </p>
            <div className="rail-socials">
              <a href={GITHUB} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
            </div>
            <ThemeSwitcher />
          </div>
        </header>
        <div className="portfolio-content">
          <main id="main" ref={mainRef} tabIndex={-1}>
            <section
              className="workbench wrap"
              id="workbench"
              tabIndex={-1}
              aria-labelledby="intro-title"
            >
              <span className="section-signal" aria-hidden="true" />
              <div className="workspace-topline">
                <span>ENGINEERING PORTFOLIO</span>
                <span className="opportunity">
                  <i aria-hidden="true" />
                  Open to opportunities
                </span>
              </div>
              <div className="workbench-intro">
                <div className="intro-copy" id="about" tabIndex={-1}>
                  <h1 id="intro-title">
                    Jhon Smith Romero<span>.</span>
                  </h1>
                  <p className="intro-role">Senior Full-stack Engineer</p>
                  <p className="intro-stack" aria-label="Core technologies">
                    React · TypeScript · Node.js · Azure
                  </p>
                  <p>
                    7+ years connecting thoughtful interfaces with the services
                    and data behind them. From feature design to full-stack
                    implementation and cloud delivery.
                  </p>
                </div>
                <img
                  className="profile-portrait"
                  src="./jhon-smith-romero.jpg"
                  alt="Jhon Smith Romero"
                  width="160"
                  height="160"
                  fetchPriority="high"
                />
              </div>
              <TechnologyOverview />
              <StackMap />
              <div className="workbench-caption">
                <span>The tools I use. The work behind them.</span>
                <a href="#resume">
                  Explore my experience <span aria-hidden="true">↓</span>
                </a>
              </div>
            </section>
            <ResumeSection />
            <section
              className="contact-section wrap"
              id="contact"
              tabIndex={-1}
              aria-labelledby="contact-title"
              data-reveal="0"
            >
              <span className="section-signal" aria-hidden="true" />
              <span className="eyebrow">GET IN TOUCH</span>
              <div>
                <h2 id="contact-title">Let’s talk.</h2>
                <a
                  className="primary-button"
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                >
                  Find me on LinkedIn <Arrow diagonal />
                </a>
              </div>
              <p>
                Open to full-stack opportunities with JavaScript, TypeScript,
                React, and Node.js.
              </p>
            </section>
            <section
              className="lab-section lab-collection wrap"
              id="lab"
              tabIndex={-1}
              aria-labelledby="lab-title"
            >
              <span className="section-signal" aria-hidden="true" />
              <div className="section-heading" data-reveal="0">
                <div>
                  <span className="eyebrow">A PLACE TO EXPLORE</span>
                  <h2 id="lab-title">
                    Labs & play<span className="heading-dot">.</span>
                  </h2>
                </div>
                <p>
                  Try an idea. Follow your curiosity. A few small things I’ve
                  built for you to get your hands on.
                </p>
              </div>
              <nav
                className="collection-index"
                aria-label="Explore the collection"
              >
                <a href="#signal-lab">
                  <span>01</span> Signal Lab <span aria-hidden="true">↘</span>
                </a>
                <a href="#connection-game">
                  <span>02</span> Connection puzzle{" "}
                  <span aria-hidden="true">↘</span>
                </a>
                <a href="#motion-studio">
                  <span>03</span> Motion studio{" "}
                  <span aria-hidden="true">↘</span>
                </a>
              </nav>
              <article
                className="signal-exhibit"
                id="signal-lab"
                tabIndex={-1}
                aria-labelledby="signal-title"
              >
                <div className="exhibit-caption">
                  <div>
                    <span className="play-kicker">01 / UNDER THE SURFACE</span>
                    <h3 id="signal-title">Signal Lab</h3>
                  </div>
                  <p>
                    Turn up the traffic. Break the database. See what keeps a
                    system moving.
                  </p>
                </div>
                <LabSettingsProvider>
                  <SignalLab />
                </LabSettingsProvider>
              </article>
              <article
                className="play-exhibit"
                id="connection-game"
                tabIndex={-1}
                aria-labelledby="route-title"
              >
                <RoutePuzzle />
              </article>
              <article
                className="play-exhibit"
                id="motion-studio"
                tabIndex={-1}
                aria-labelledby="motion-title"
              >
                <MotionStudio />
              </article>
            </section>
          </main>
          <footer className="site-footer wrap">
            <span>© 2026 Jhon Smith Romero</span>
            <a href="#workbench">Back to overview ↑</a>
            <a href={REPO} target="_blank" rel="noreferrer">
              View source <Arrow diagonal />
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}
