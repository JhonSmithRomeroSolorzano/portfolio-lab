import { StackMap } from "./StackMap";
import { TechnologyOverview } from "./TechnologyOverview";
import { professionalProfile } from "./data/profile";

export function OverviewSection() {
  return (
    <section
      className="workbench wrap"
      id="workbench"
      tabIndex={-1}
      aria-labelledby="intro-title"
    >
      <span className="section-signal" aria-hidden="true" />
      <div className="workbench-intro">
        <div className="intro-copy" id="about" tabIndex={-1}>
          <h1 id="intro-title">
            <span className="intro-given-name">Jhon Smith</span> Romero
            <span className="heading-dot">.</span>
          </h1>
          <div className="intro-details">
            <div className="intro-position">
              <p className="intro-role">{professionalProfile.role}</p>
              <p className="intro-stack" aria-label="Core technologies">
                React · TypeScript · Node.js · Azure
              </p>
            </div>
            <p className="intro-summary">{professionalProfile.summary}</p>
          </div>
        </div>
      </div>
      <TechnologyOverview />
      <StackMap />
      <div className="workbench-caption">
        <span>The tools I use. The work behind them.</span>
      </div>
    </section>
  );
}
