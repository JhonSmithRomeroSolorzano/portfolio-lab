import { LabBrowser } from "./labs/LabBrowser";
import { useLabSettings } from "./labs/LabSettingsProvider";
import { hasSetup, setupUrl } from "./labs/lab-setup";
import { labEntryUrl } from "./lab-navigation";
import type { Scenario } from "../../src/domain/simulation/simulation";
import { LABS, LAB_AREAS } from "./lab-catalog";
import type { LabId } from "./lab-catalog";
export function LabNavigation({
  active,
  onSelect,
  scenario,
}: {
  active: LabId;
  scenario: Scenario;
  onSelect: (id: LabId) => void;
}) {
  const { settings } = useLabSettings();
  const selected = LABS.find((lab) => lab.id === active)!;
  return (
    <div className="lab-navigation">
      <div>
        <label htmlFor="lab-picker">Choose a lab</label>
        <select
          id="lab-picker"
          value={active}
          onChange={(event) => onSelect(event.target.value as LabId)}
        >
          {LAB_AREAS.map((area) => (
            <optgroup key={area} label={area}>
              {LABS.filter((lab) => lab.area === area).map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p>
        <span>{selected.area}</span>
        {selected.detail}
      </p>
      <LabBrowser active={active} onSelect={onSelect} />
      <details className="lab-entry-link">
        <summary>Link to this lab</summary>
        <label htmlFor="lab-entry-url">Lab entry link</label>
        <input
          id="lab-entry-url"
          value={setupUrl(
            labEntryUrl(window.location.href, active, scenario),
            active,
            settings,
          )}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
        />
        <small>
          {hasSetup(active)
            ? "Includes this experiment’s settings. Results are recomputed when opened."
            : "Includes the shared traffic setup. Other independent lab controls use their defaults."}
        </small>
      </details>
    </div>
  );
}
