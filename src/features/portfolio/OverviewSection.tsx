import { StackMap } from "./StackMap";
import { TechnologyOverview } from "./TechnologyOverview";

export function OverviewSection() {
  return (
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
            7+ years connecting thoughtful interfaces with the services and data
            behind them. From feature design to full-stack implementation and
            cloud delivery.
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
  );
}
