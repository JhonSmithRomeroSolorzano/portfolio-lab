import type { Scenario } from "../src/domain/simulation/simulation.ts";
import { validStrictScenario } from "../src/domain/simulation/scenario-validation.ts";
import { simulate } from "../src/domain/simulation/simulation.ts";
export type BatchResult =
  | { line: number; ok: false; error: string }
  | {
      line: number;
      ok: true;
      scenario: Scenario;
      result: ReturnType<typeof simulate>;
    };
export const MAX_BATCH_BYTES = 1_048_576;
export function replayBatch(input: string) {
  if (Buffer.byteLength(input, "utf8") > MAX_BATCH_BYTES)
    throw new Error("Input exceeds 1 MiB.");
  return input.split(/\r?\n/).flatMap<BatchResult>((line, index) => {
    if (!line.trim()) return [];
    const number = index + 1;
    let scenario: unknown;
    try {
      scenario = JSON.parse(line);
    } catch {
      return [{ line: number, ok: false as const, error: "Invalid JSON." }];
    }
    if (!validStrictScenario(scenario))
      return [{ line: number, ok: false as const, error: "Invalid scenario." }];
    return [
      { line: number, ok: true as const, scenario, result: simulate(scenario) },
    ];
  });
}
