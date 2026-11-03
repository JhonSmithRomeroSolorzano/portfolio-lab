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
import { MotionSettings } from "../shared/ui/MotionSettings";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import { MatrixBackdrop } from "./MatrixBackdrop";

import { SOURCE_REPOSITORY } from "../shared/project";
import { useMobileNavigation } from "./useMobileNavigation";
export function App() {
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menu = useMobileNavigation(navRef);
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    if (!menu.ready) return;
    const legacyDestination =
      window.location.hash === "#signal-lab"
        ? "lab"
        : window.location.hash === "#pin-lock"
          ? "jet-engine"
          : null;
    if (legacyDestination) {
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${legacyDestination}`,
      );
    }
    // A client-rendered anchor may not exist during the browser's first hash lookup.
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && mainRef.current?.contains(target)) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [menu.ready]);
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
        <MatrixBackdrop paused={!menu.ready || reducedMotion} />
        <span className="reading-progress" aria-hidden="true" />
        <header
          className="identity-rail"
          data-menu-ready={menu.ready}
          data-menu-open={menu.open}
        >
          <nav
            id="main-navigation"
            aria-label="Main navigation"
            ref={navRef}
            onClick={menu.navigate}
          >
            <span className="nav-cursor" aria-hidden="true" />
            <a href="#workbench">Overview</a>
            <a href="#resume">Experience</a>
            <a href="#contact">Contact</a>
            <a href="#lab">Labs & play</a>
          </nav>
          <div className="rail-bottom">
            <ThemeSwitcher />
            <MotionSettings />
            <button
              className="mobile-menu-toggle"
              type="button"
              ref={menu.button}
              hidden={!menu.ready}
              aria-label="Menu"
              title="Menu"
              aria-expanded={menu.open}
              aria-controls="main-navigation"
              onClick={menu.toggle}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path
                  d={menu.open ? "M6 6l12 12M6 18L18 6" : "M4 8h16M4 16h16"}
                />
              </svg>
            </button>
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
            <span>Pereira, Colombia</span>
            <a href={GITHUB} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href={LINKEDIN} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a href="#workbench">Back to overview ↑</a>
            <a href={SOURCE_REPOSITORY} target="_blank" rel="noreferrer">
              View source <Arrow diagonal />
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}
