import { validScenario } from "../../src/domain/simulation/scenario-validation";
export { validScenario } from "../../src/domain/simulation/scenario-validation";
import type { Scenario } from "../../src/domain/simulation/simulation";
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

export function restoreExperiment(
  entries: readonly SavedExperiment[],
  removed: SavedExperiment,
  index: number,
): SavedExperiment[] {
  if (entries.length >= 8)
    throw new Error("Make room before restoring this experiment.");
  if (entries.some((e) => e.id === removed.id))
    throw new Error("This experiment is already in the library.");
  const next = [...entries];
  next.splice(Math.max(0, Math.min(next.length, index)), 0, {
    ...removed,
    scenario: { ...removed.scenario },
  });
  return next;
}

/** A null result means the event belongs to another feature, not an empty library. */
export function libraryFromStorageEvent(
  event: Pick<StorageEvent, "key" | "newValue">,
): SavedExperiment[] | null {
  if (event.key === null) return [];
  return event.key === LIBRARY_KEY ? parseLibrary(event.newValue) : null;
}
