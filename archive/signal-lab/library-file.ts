import type { SavedExperiment } from "./experiment-library";
import { validStrictScenario } from "../../src/domain/simulation/scenario-validation";
import type { Scenario } from "../../src/domain/simulation/simulation";
export type PortableExperiment = { name: string; scenario: Scenario };
export function exportLibrary(entries: readonly SavedExperiment[]) {
  return JSON.stringify(
    {
      format: "signal-lab-library",
      version: 1,
      experiments: entries.map(({ name, scenario }) => ({ name, scenario })),
    },
    null,
    2,
  );
}
export function importLibrary(raw: string): PortableExperiment[] {
  if (raw.length > 100_000)
    throw new Error("Choose a library smaller than 100 KB.");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("This library is not valid JSON.");
  }
  if (
    value?.format !== "signal-lab-library" ||
    value.version !== 1 ||
    !Array.isArray(value.experiments) ||
    value.experiments.length > 8 ||
    value.experiments.some((e: unknown) => {
      if (!e || typeof e !== "object") return true;
      const entry = e as PortableExperiment;
      return (
        typeof entry.name !== "string" ||
        !entry.name.trim() ||
        entry.name.trim().length > 40 ||
        !validStrictScenario(entry.scenario)
      );
    })
  )
    throw new Error("This is not a supported Signal Lab library.");
  return value.experiments.map((e: PortableExperiment) => ({
    name: e.name.trim(),
    scenario: { ...e.scenario },
  }));
}
const signature = (e: PortableExperiment) =>
  JSON.stringify([
    e.name,
    e.scenario.requestsPerSecond,
    e.scenario.cacheEnabled,
    e.scenario.database,
    e.scenario.cacheHitPercent ?? 80,
    e.scenario.databaseConnections ?? 8,
    e.scenario.writePercent ?? 0,
  ]);
export function mergeLibrary(
  existing: readonly SavedExperiment[],
  incoming: readonly PortableExperiment[],
  makeId: () => string = () => crypto.randomUUID(),
): SavedExperiment[] {
  const result = [...existing],
    seen = new Set(existing.map(signature));
  for (const entry of incoming) {
    const key = signature(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...entry, scenario: { ...entry.scenario }, id: makeId() });
  }
  if (result.length > 8)
    throw new Error(
      "This import would exceed eight saved experiments. Remove or back up some first.",
    );
  return result;
}
