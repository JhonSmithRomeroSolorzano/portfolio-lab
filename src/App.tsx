import { useEffect, useState } from "react";
import { DEFAULT_SCENARIO, simulate } from "./simulation";
import type { DatabaseMode, Scenario } from "./simulation";
import { scenarioFromSearch, scenarioUrl } from "./scenario-url";
import { ShareExperiment } from "./ShareExperiment";
import { Comparison } from "./ComparisonPanel";
import { Presets } from "./ScenarioPresets";
import { ExperimentLibrary } from "./ExperimentLibrary";

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
    "The database can keep up. Cached reads leave more room for requests that need fresh data.",
  overloaded:
    "Demand exceeds the connection pool’s capacity. Caching or less incoming traffic can reduce the pressure.",
  degraded:
    "The database is offline. Warm cached reads still succeed, but uncached requests time out.",
  unavailable:
    "With no cache and an offline database, every request times out. There is no fallback in this model.",
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
          SIGNAL LAB <span className="version">v0.1</span>
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
                    {scenario.cacheEnabled ? "80% warm-cache hits" : "Bypassed"}
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
                      : `${scenario.database === "slow" ? "400" : "80"} ms · 8 connections`}
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
              min="20"
              max="600"
              step="20"
              value={scenario.requestsPerSecond}
              onChange={(event) =>
                update({ requestsPerSecond: Number(event.target.value) })
              }
            />
            <div className="range-labels">
              <span>Quiet morning</span>
              <span>Rush hour</span>
            </div>
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
        <ExperimentLibrary scenario={scenario} onSelect={setScenario} />
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
            Each request adds 12 ms of API overhead. With caching enabled, 80%
            of reads hit a warm cache in 8 ms. The remaining reads share 8
            database connections: 80 ms per read normally, 400 ms when slow.
            Database capacity is connections × 1,000 ÷ latency. Requests above
            that capacity, or to an offline database, time out after 1,000 ms.
          </p>
          <p>
            The mean includes successes and timeouts. This steady-state model
            has no queue, retries, cache expiry, writes, or network variance.
            Its purpose is to make the trade-offs visible; it does not predict
            production performance.
          </p>
        </div>
      )}
    </div>
  );
}

const skills = [
  {
    number: "01",
    title: "The experience.",
    text: "Interfaces that connect people to the systems behind them.",
    tags: ["React", "TypeScript", "JavaScript", "Mithril.js"],
  },
  {
    number: "02",
    title: "The system.",
    text: "APIs, data flows, and the details that keep an application moving.",
    tags: ["Node.js", "Express", "NoSQL", "Redis", "WebSockets"],
  },
  {
    number: "03",
    title: "The delivery.",
    text: "Testing, repeatable builds, and getting changes into production.",
    tags: ["Docker", "GitHub Actions", "CI/CD", "Testing"],
  },
];

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header wrap">
        <a className="brand" href="#" aria-label="Jhon Smith Romero, home">
          <span className="monogram">
            jr<span>.</span>
          </span>
          <span>
            Jhon Smith
            <br />
            <strong>Romero</strong>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#lab">The lab</a>
          <a href="#about">About</a>
          <a href="#journal">Build log</a>
        </nav>
        <a
          className="header-link"
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <Arrow diagonal />
        </a>
      </header>
      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-kicker">
            <span className="eyebrow">FULL-STACK DEVELOPER</span>
            <span className="availability">
              <i />
              Open to opportunities
            </span>
          </div>
          <h1 id="hero-title">
            Thoughtful code.
            <br />
            <em>Reliable systems.</em>
          </h1>
          <div className="hero-bottom">
            <p>
              I’m Jhon, a developer working across the JavaScript stack.
              <br className="desktop-break" /> I connect useful interfaces with
              the systems that power them.
            </p>
            <a className="primary-button" href="#lab">
              Step inside the lab <Arrow />
            </a>
          </div>
          <div className="hero-foot">
            <span>5+ years in full-stack development</span>
            <span>
              JAVASCRIPT & TYPESCRIPT <span aria-hidden="true">↙</span>
            </span>
          </div>
        </section>
        <section
          className="lab-section wrap"
          id="lab"
          aria-labelledby="lab-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="section-index">01 /</span> THE ENGINEERING LAB
              </span>
              <h2 id="lab-title">
                Don’t just read about it.
                <br />
                <em>Pull a few levers.</em>
              </h2>
            </div>
            <p>
              Good engineering is a series of choices. <br />
              Change the traffic. Slow the database. <br />
              See what a cache can—and can’t—do.
            </p>
          </div>
          <SignalLab />
          <div className="project-caption">
            <span>
              <b>Signal Lab</b> · An original portfolio experiment
            </span>
            <span>React / TypeScript / Tested model</span>
          </div>
        </section>
        <section
          className="about-section wrap"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="about-intro">
            <span className="eyebrow">
              <span className="section-index">02 /</span> ACROSS THE STACK
            </span>
            <h2 id="about-title">
              From the first click
              <br />
              <em>to the last query.</em>
            </h2>
            <p>
              For more than five years, I’ve worked as a full-stack developer
              for a US-based company. My day-to-day work spans frontend and
              backend development, with a focus on the JavaScript and TypeScript
              ecosystem.
            </p>
            <p>
              I’ve worked primarily with NoSQL databases, alongside experience
              with SQL, caching, real-time communication, and deployment
              workflows.
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
            {skills.map((skill) => (
              <article className="skill-row" key={skill.number}>
                <span className="skill-number">{skill.number}</span>
                <div>
                  <h3>{skill.title}</h3>
                  <p>{skill.text}</p>
                  <div className="tags">
                    {skill.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section
          className="journal-section wrap"
          id="journal"
          aria-labelledby="journal-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="section-index">03 /</span> BUILDING IN PUBLIC
              </span>
              <h2 id="journal-title">The work keeps moving.</h2>
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
          <article className="journal-entry">
            <time dateTime="2026-10-05">OCT 05, 2026</time>
            <div>
              <span className="journal-tag">FIRST MILESTONE</span>
              <h3>A portfolio with something to explore.</h3>
              <p>
                The foundation: an interactive cache and database model, a
                responsive React interface, and tests for the behavior behind
                the demo. Experiment links now preserve your settings, with a
                copy button so you can share a specific scenario.
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
        <section className="contact-section wrap">
          <span className="eyebrow">LET’S BUILD SOMETHING USEFUL</span>
          <div>
            <h2>
              Your next idea.
              <br />
              <em>Let’s make it work.</em>
            </h2>
            <a
              className="primary-button"
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
            >
              Find me on GitHub <Arrow diagonal />
            </a>
          </div>
          <p>
            Open to full-stack opportunities with JavaScript, TypeScript, React,
            and Node.js.
          </p>
        </section>
      </main>
      <footer className="site-footer wrap">
        <span>© 2026 Jhon Smith Romero</span>
        <span>Built with curiosity. Shipped with care.</span>
        <a href={REPO} target="_blank" rel="noreferrer">
          View source <Arrow diagonal />
        </a>
      </footer>
    </>
  );
}
