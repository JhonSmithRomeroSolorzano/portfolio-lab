import { LABS, LAB_AREAS } from "./lab-catalog";
import type { LabId } from "./lab-catalog";
export function LabNavigation({
  active,
  onSelect,
}: {
  active: LabId;
  onSelect: (id: LabId) => void;
}) {
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
    </div>
  );
}
