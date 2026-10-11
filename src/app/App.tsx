import { useEffect, useLayoutEffect, useRef } from "react";
import { Arrow } from "../shared/ui/Arrow";
import { PlaygroundSection } from "../features/playground/PlaygroundSection";
import { observeScrollReveals } from "./scroll-reveals";
import { observePortfolioMotion } from "./portfolio-motion";
import { OverviewSection } from "../features/portfolio/OverviewSection";
import { ContactSection } from "../features/portfolio/ContactSection";
import { ResumeSection } from "../features/portfolio/ResumeSection";
import { GITHUB, LINKEDIN } from "../features/portfolio/data/profile";
import { ThemeSwitcher } from "../shared/ui/ThemeSwitcher";
import { BrandMark } from "../features/portfolio/BrandMark";

const REPO = `${GITHUB}/portfolio-lab`;
export function App() {
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (window.location.hash === "#signal-lab") {
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#lab`,
      );
    }
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
            <OverviewSection />
            <ResumeSection />
            <ContactSection />
            <PlaygroundSection />
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
