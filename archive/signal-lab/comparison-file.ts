import type { Scenario } from "../../src/domain/simulation/simulation";
import { validStrictScenario } from "../../src/domain/simulation/scenario-validation";
export interface ComparisonSnapshot {
  baseline: Scenario;
  current: Scenario;
}
export function exportComparison(value: ComparisonSnapshot): string {
  return JSON.stringify(
    { format: "signal-lab-comparison", version: 1, ...value },
    null,
    2,
  );
}
export function importComparison(raw: string): ComparisonSnapshot {
  if (raw.length > 100_000)
    throw new Error("Choose a comparison smaller than 100 KB.");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("This comparison is not valid JSON.");
  }
  if (
    value?.format !== "signal-lab-comparison" ||
    value.version !== 1 ||
    !validStrictScenario(value.baseline) ||
    !validStrictScenario(value.current)
  )
    throw new Error("This is not a supported Signal Lab comparison.");
  return { baseline: { ...value.baseline }, current: { ...value.current } };
}
