import { useEffect, useLayoutEffect, useRef } from "react";
import { Arrow } from "./Arrow";
import { DeferredExperiment } from "./DeferredExperiment";
import { observeScrollReveals } from "./scroll-reveals";
import { observePortfolioMotion } from "./portfolio-motion";
import { StackMap } from "./StackMap";
import { TechnologyOverview } from "./TechnologyOverview";
import { ResumeSection } from "./ResumeSection";
import { GITHUB, LINKEDIN } from "./profile";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandMark } from "./BrandMark";

const REPO = `${GITHUB}/portfolio-lab`;
const loadSignal = () => import("./SignalLab").then((module) => module.default);
const loadPuzzle = () =>
  import("./play/RoutePuzzle").then((module) => module.RoutePuzzle);
const loadMotion = () =>
  import("./play/MotionStudio").then((module) => module.MotionStudio);

export function App() {
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    // A client-rendered anchor may not exist during the browser's first hash lookup.
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && mainRef.current?.contains(target)) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);
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
                <DeferredExperiment
                  id="signal-lab"
                  title="Signal Lab"
                  load={loadSignal}
                />
              </article>
              <article
                className="play-exhibit"
                id="connection-game"
                tabIndex={-1}
                aria-labelledby="route-title"
              >
                <DeferredExperiment
                  id="connection-game"
                  title="Connection puzzle"
                  titleId="route-title"
                  load={loadPuzzle}
                />
              </article>
              <article
                className="play-exhibit"
                id="motion-studio"
                tabIndex={-1}
                aria-labelledby="motion-title"
              >
                <DeferredExperiment
                  id="motion-studio"
                  title="Motion studio"
                  titleId="motion-title"
                  load={loadMotion}
                />
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
