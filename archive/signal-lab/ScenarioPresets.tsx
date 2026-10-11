import { ToolPanel } from "./ToolPanel";
import { PRESETS } from "../../src/domain/simulation/presets";
import type { Scenario } from "../../src/domain/simulation/simulation";
export function Presets({
  onSelect,
}: {
  onSelect: (scenario: Scenario) => void;
}) {
  return (
    <ToolPanel title="Try a guided experiment">
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
    </ToolPanel>
  );
}
