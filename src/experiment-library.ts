import type { Scenario } from "./simulation";
export interface SavedExperiment {
  id: string;
  name: string;
  scenario: Scenario;
}
export const LIBRARY_KEY = "signal-lab.experiments.v1";
export function validScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const s = value as Scenario;
  return (
    Number.isInteger(s.requestsPerSecond) &&
    s.requestsPerSecond >= 20 &&
    s.requestsPerSecond <= 600 &&
    s.requestsPerSecond % 20 === 0 &&
    typeof s.cacheEnabled === "boolean" &&
    ["normal", "slow", "offline"].includes(s.database)
  );
}
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
