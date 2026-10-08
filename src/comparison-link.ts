import type { Scenario } from "./simulation";
import { shareScenarioUrl } from "./share-link";
import { validStrictScenario } from "./scenario-validation";
export function shareComparisonUrl(
  currentUrl: string,
  baseline: Scenario,
  current: Scenario,
) {
  const url = new URL(shareScenarioUrl(currentUrl, current));
  url.searchParams.set("comparison", "1");
  url.searchParams.set("baseline", JSON.stringify(baseline));
  return url.toString();
}
export function baselineFromSearch(search: string): Scenario | null {
  if (search.length > 10_000) return null;
  const params = new URLSearchParams(search);
  if (
    params.getAll("comparison").length !== 1 ||
    params.get("comparison") !== "1" ||
    params.getAll("baseline").length !== 1
  )
    return null;
  try {
    const value = JSON.parse(params.get("baseline")!);
    return validStrictScenario(value) ? { ...value } : null;
  } catch {
    return null;
  }
}
export function clearComparisonUrl(currentUrl: string): string {
  const url = new URL(currentUrl);
  url.searchParams.delete("comparison");
  url.searchParams.delete("baseline");
  return url.toString();
}
