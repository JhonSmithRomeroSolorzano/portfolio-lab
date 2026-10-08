import { validStrictScenario } from "./scenario-validation";
import type { Scenario } from "./simulation";
export const BASELINE_KEY = "signal-lab.baseline.v1";
export function parseBaseline(raw: string | null): Scenario | null {
  try {
    if (!raw || raw.length > 10_000) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 && validStrictScenario(value.scenario)
      ? { ...value.scenario }
      : null;
  } catch {
    return null;
  }
}
export function loadBaseline(): Scenario | null {
  try {
    return parseBaseline(localStorage.getItem(BASELINE_KEY));
  } catch {
    return null;
  }
}
export function saveBaseline(
  value: Scenario | null,
  storage: Pick<Storage, "setItem" | "removeItem">,
): boolean {
  try {
    if (value)
      storage.setItem(
        BASELINE_KEY,
        JSON.stringify({ version: 1, scenario: value }),
      );
    else storage.removeItem(BASELINE_KEY);
    return true;
  } catch {
    return false;
  }
}
