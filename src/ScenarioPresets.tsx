import { PRESETS } from "./presets";
import type { Scenario } from "./simulation";
export function Presets({
  onSelect,
}: {
  onSelect: (scenario: Scenario) => void;
}) {
  return (
    <details className="tool-panel">
      <summary>Try a guided experiment</summary>
      <div className="tool-content preset-grid">
        {PRESETS.map((preset) => (
          <article key={preset.name}>
            <h4>{preset.name}</h4>
            <p>{preset.description}</p>
            <button
              className="tool-button"
              onClick={() => onSelect({ ...preset.scenario })}
            >
              Load {preset.name.toLowerCase()}
            </button>
          </article>
        ))}
      </div>
    </details>
  );
}
