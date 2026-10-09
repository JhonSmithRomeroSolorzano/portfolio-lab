import { languages, testing } from "./technology-stack";

export function TechnologyOverview() {
  return (
    <section className="technology-overview" aria-label="My technology stack">
      <div className="stack-languages">
        <span className="technology-label">Languages</span>
        <strong>{languages.join(" · ")}</strong>
        <span>Across frontend &amp; backend</span>
      </div>
      <div className="stack-testing">
        <span className="technology-label">Testing across the stack</span>
        <strong>{testing.tools.join(" · ")}</strong>
        <span>{testing.levels.join(" · ")}</span>
      </div>
    </section>
  );
}
