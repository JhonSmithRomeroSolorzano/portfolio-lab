import { languages, stackLayers, testing } from "./technology-stack";

export function TechnologyOverview() {
  return (
    <section className="technology-overview" aria-label="My technology stack">
      <div className="stack-languages">
        <span className="technology-label">Languages</span>
        <strong>{languages.join(" · ")}</strong>
        <span>Across frontend &amp; backend</span>
      </div>
      <div className="technology-areas">
        {stackLayers.map((layer) => (
          <div className="technology-area" key={layer.id}>
            <h2>{layer.name}</h2>
            <dl>
              {layer.groups.map((group) => (
                <div key={group.label}>
                  <dt>{group.label}</dt>
                  <dd>{group.items.join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="stack-testing">
        <span className="technology-label">Testing across the stack</span>
        <strong>{testing.tools.join(" · ")}</strong>
        <span>{testing.levels.join(" · ")}</span>
      </div>
    </section>
  );
}
