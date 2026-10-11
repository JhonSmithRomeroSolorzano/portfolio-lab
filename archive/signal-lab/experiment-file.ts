import { validScenario } from "./experiment-library";
import { simulate } from "../../src/domain/simulation/simulation";
import type { Scenario } from "../../src/domain/simulation/simulation";
export function exportExperiment(scenario: Scenario) {
  return JSON.stringify(
    {
      format: "signal-lab",
      version: 1,
      scenario,
      result: simulate(scenario),
      notice: "Illustrative model, not production measurements.",
    },
    null,
    2,
  );
}
export function importExperiment(raw: string): Scenario {
  if (raw.length > 100_000)
    throw new Error("Choose an experiment smaller than 100 KB.");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    value?.format !== "signal-lab" ||
    value.version !== 1 ||
    !validScenario(value.scenario)
  )
    throw new Error("This is not a supported Signal Lab experiment.");
  return { ...value.scenario };
}
export function downloadText(
  text: string,
  filename: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  try {
    document.body.append(a);
    a.click();
  } finally {
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}
