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
import { StackMap } from "./StackMap";
import { TechnologyOverview } from "./TechnologyOverview";
import { stackLayers } from "./technology-stack";
import { ResumeSection } from "./ResumeSection";
import { LINKEDIN } from "./profile";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandMark } from "./BrandMark";

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
  const result = simulate(scenario);
  const update = (change: Partial<Scenario>) =>
    setScenario((current) => ({ ...current, ...change }));
  const statusClass = result.status === "healthy" ? "good" : "warning";

  return (
    <div className="lab-shell">
      <div className="lab-topbar">
        <span>
          <span className="signal-mark" aria-hidden="true">
            ▥
          </span>{" "}
          SIGNAL LAB <span className="version">v0.2</span>
        </span>
        <span className="simulation-tag">INTERACTIVE SIMULATION</span>
      </div>
      <div className="lab-body">
        <div className="lab-display">
          <div className="display-heading">
            <div>
              <span className="eyebrow dark-label">REQUEST FLOW</span>
              <h3>A small system. Real trade-offs.</h3>
            </div>
            <span className={`status ${statusClass}`} role="status">
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
          <div className="metrics" aria-live="polite" aria-atomic="true">
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
                style={{ width: `${(result.failed / result.offered) * 100}%` }}
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
              <output htmlFor="traffic">
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
              {(["normal", "slow", "offline"] as DatabaseMode[]).map((mode) => (
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
              ))}
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
                  <output htmlFor="cache-rate">
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
                  <output htmlFor="pool-size">
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
                    update({ databaseConnections: Number(event.target.value) })
                  }
                />
              </div>
              <div className="control-block">
                <label htmlFor="write-share">
                  Write requests{" "}
                  <output htmlFor="write-share">
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
          <ShareExperiment key={JSON.stringify(scenario)} scenario={scenario} />
          <button
            className="reset-button"
            type="button"
            onClick={() => setScenario({ ...DEFAULT_SCENARIO })}
          >
            ↺ Reset the experiment
          </button>
          <p className="model-note">
            A browser-only model with explicit assumptions. No live services or
            production measurements.
          </p>
        </div>
      </div>
      <div className="experiment-tools">
        <Presets onSelect={setScenario} />
        <Comparison scenario={scenario} />
        <CapacitySweepPanel scenario={scenario} />
        <CacheExpiryPanel />
        <QueueExperiment />
        <RequestTrace key={JSON.stringify(scenario)} scenario={scenario} />
        <ExperimentLibrary scenario={scenario} onSelect={setScenario} />
        <ExperimentFiles scenario={scenario} onSelect={setScenario} />
      </div>
      <div className="lab-bottom">
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
      {showModel && (
        <div id="model-details" className="model-details">
          <p>
            Each request adds 12 ms of API overhead. With caching enabled,{" "}
            {scenario.cacheHitPercent ?? 80}% of reads hit a warm cache in 8 ms.
            Uncached reads and all writes share{" "}
            {scenario.databaseConnections ?? 8} database connections: 80 ms per
            read normally, 400 ms when slow. Reads and writes have the same
            modeled database cost. Database capacity is connections × 1,000 ÷
            latency. Requests above that capacity, or to an offline database,
            time out after 1,000 ms.
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
  );
}

export function App() {
  const mainRef = useRef<HTMLElement>(null);
  useEffect(
    () => (mainRef.current ? observeScrollReveals(mainRef.current) : undefined),
    [],
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="portfolio-frame">
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
          <nav aria-label="Main navigation">
            <a href="#workbench">
              <span aria-hidden="true">⌘</span> Workbench
            </a>
            <a href="#lab">
              <span aria-hidden="true">↯</span> Signal Lab
            </a>
            <a href="#resume">
              <span aria-hidden="true">↗</span> Résumé
            </a>
            <a href="#about">
              <span aria-hidden="true">＋</span> About
            </a>
            <a href="#journal">
              <span aria-hidden="true">≡</span> Build notes
            </a>
            <a href="#contact">
              <span aria-hidden="true">@</span> Contact
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
              aria-labelledby="intro-title"
            >
              <div className="workspace-topline">
                <span>FULL-STACK DEVELOPER</span>
                <span className="opportunity">
                  <i aria-hidden="true" />
                  Open to opportunities
                </span>
              </div>
              <div className="workbench-intro">
                <div className="intro-copy">
                  <h1 id="intro-title">
                    Jhon Smith Romero<span>.</span>
                  </h1>
                  <p>
                    I build interfaces with React and Material UI, backend
                    services with Node.js and Express, and work with NoSQL and
                    SQL databases.
                  </p>
                  <div className="intro-links">
                    <a className="resume-shortcut" href="#resume">
                      <span>7+ years in software</span>
                      <strong>
                        Explore my résumé <Arrow diagonal />
                      </strong>
                    </a>
                    <a className="intro-contact" href="#contact">
                      Contact me <Arrow diagonal />
                    </a>
                  </div>
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
                <span>My stack above. A working experiment below.</span>
                <a href="#lab">
                  Try Signal Lab <span aria-hidden="true">↓</span>
                </a>
              </div>
            </section>
            <section
              className="lab-section wrap"
              id="lab"
              aria-labelledby="lab-title"
            >
              <div className="section-heading" data-reveal="0">
                <div>
                  <span className="eyebrow">INTERACTIVE PROJECT</span>
                  <h2 id="lab-title">
                    Signal Lab<span className="heading-dot">.</span>
                  </h2>
                </div>
                <p>
                  Change the traffic, cache, or database. Inspect how a small
                  system responds, then read the decisions behind the model.
                </p>
              </div>
              <SignalLab />
              <div className="project-caption">
                <span>
                  <b>Signal Lab</b> · An original portfolio experiment
                </span>
                <a
                  href={`${REPO}/blob/main/CASE_STUDY.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the engineering walkthrough ↗
                </a>
              </div>
            </section>
            <section
              className="about-section wrap"
              id="about"
              aria-labelledby="about-title"
            >
              <div className="about-intro" data-reveal="0">
                <span className="eyebrow">ABOUT JHON</span>
                <h2 id="about-title">
                  Across the stack,
                  <br />
                  through the details.
                </h2>
                <p>
                  I’m a systems and telecommunications engineer with more than
                  seven years in software development. My work spans frontend
                  and backend development, with a focus on the JavaScript and
                  TypeScript ecosystem.
                </p>
                <p>
                  NoSQL is my strongest area of database experience, alongside
                  experience with SQL, caching, real-time communication, and
                  deployment workflows.
                </p>
                <a
                  className="text-link"
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                >
                  Meet me on GitHub <Arrow diagonal />
                </a>
              </div>
              <div className="skill-list">
                {stackLayers.map((skill, index) => (
                  <article
                    className="skill-row"
                    key={skill.id}
                    data-reveal={index * 50}
                  >
                    <span className="skill-marker" aria-hidden="true">
                      ↳
                    </span>
                    <div>
                      <h3>{skill.name}</h3>
                      <p>{skill.description}</p>
                      <div className="tags">
                        {skill.groups
                          .flatMap((group) => group.items)
                          .map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <ResumeSection />
            <section
              className="journal-section wrap"
              id="journal"
              aria-labelledby="journal-title"
            >
              <div className="section-heading" data-reveal="0">
                <div>
                  <span className="eyebrow">WORK IN PROGRESS</span>
                  <h2 id="journal-title">Build notes.</h2>
                </div>
                <a
                  className="text-link"
                  href={`${REPO}/blob/main/ROADMAP.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  See the roadmap <Arrow diagonal />
                </a>
              </div>
              <article className="journal-entry" data-reveal="0">
                <time dateTime="2026-10-05">OCT 05, 2026</time>
                <div>
                  <span className="journal-tag">LAB + LOCAL API</span>
                  <h3>From a sketch to a repeatable experiment.</h3>
                  <p>
                    Compare setups, save experiments, trace a request, and
                    explore cache expiry and burst queues. The repository now
                    includes a tested local Node API, batch replay tools, and a
                    walkthrough explaining the model’s decisions and limits.
                  </p>
                </div>
                <a
                  href={REPO}
                  className="journal-arrow"
                  aria-label="View the portfolio source code"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Arrow diagonal />
                </a>
              </article>
            </section>
            <section
              className="contact-section wrap"
              id="contact"
              aria-labelledby="contact-title"
              data-reveal="0"
            >
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
          </main>
          <footer className="site-footer wrap">
            <span>© 2026 Jhon Smith Romero</span>
            <a href="#workbench">Back to the workbench ↑</a>
            <a href={REPO} target="_blank" rel="noreferrer">
              View source <Arrow diagonal />
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}
