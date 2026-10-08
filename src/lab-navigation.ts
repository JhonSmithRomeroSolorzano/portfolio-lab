import { LABS } from "./lab-catalog";
import type { LabId } from "./lab-catalog";
import { baselineFromSearch, shareComparisonUrl } from "./comparison-link";
import { shareScenarioUrl } from "./share-link";
import type { Scenario } from "./simulation";
export function labFromSearch(search: string): LabId {
  const params = new URLSearchParams(search);
  const id = params.getAll("lab").length === 1 ? params.get("lab") : null;
  return (
    LABS.find((lab) => lab.id === id)?.id ??
    (baselineFromSearch(search) ? "compare" : "traffic")
  );
}
export function labUrl(current: string, id: LabId) {
  const url = new URL(current);
  url.searchParams.delete("lab");
  if (id !== "traffic") url.searchParams.set("lab", id);
  url.hash = "lab";
  return url.toString();
}
export function labEntryUrl(current: string, id: LabId, scenario: Scenario) {
  const baseline =
    id === "compare" ? baselineFromSearch(new URL(current).search) : null;
  const clean = baseline
    ? shareComparisonUrl(current, baseline, scenario)
    : shareScenarioUrl(current, scenario);
  return labUrl(clean, id);
}
