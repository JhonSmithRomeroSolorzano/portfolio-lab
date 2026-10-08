import { validScenario } from "./scenario-validation";
export { validScenario } from "./scenario-validation";
import type { Scenario } from "./simulation";
export interface SavedExperiment {
  id: string;
  name: string;
  scenario: Scenario;
}
export const LIBRARY_KEY = "signal-lab.experiments.v1";
export function parseLibrary(raw: string | null): SavedExperiment[] {
  try {
    if (!raw || raw.length > 100_000) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const ids = new Set<string>();
    return value
      .filter((entry): entry is SavedExperiment => {
        if (
          !entry ||
          typeof entry.id !== "string" ||
          ids.has(entry.id) ||
          typeof entry.name !== "string" ||
          !entry.name.trim() ||
          entry.name.length > 40 ||
          !validScenario(entry.scenario)
        )
          return false;
        ids.add(entry.id);
        return true;
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}
export function loadLibrary(): SavedExperiment[] {
  try {
    return parseLibrary(localStorage.getItem(LIBRARY_KEY));
  } catch {
    return [];
  }
}

export function renameExperiment(
  entries: readonly SavedExperiment[],
  id: string,
  name: string,
): SavedExperiment[] {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40)
    throw new Error("Use a name from 1 to 40 characters.");
  if (!entries.some((e) => e.id === id))
    throw new Error("This experiment no longer exists.");
  return entries.map((e) => (e.id === id ? { ...e, name: trimmed } : e));
}
export function updateExperiment(
  entries: readonly SavedExperiment[],
  id: string,
  scenario: Scenario,
): SavedExperiment[] {
  if (!validScenario(scenario)) throw new Error("This setup is invalid.");
  if (!entries.some((e) => e.id === id))
    throw new Error("This experiment no longer exists.");
  return entries.map((e) =>
    e.id === id ? { ...e, scenario: { ...scenario } } : e,
  );
}
