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
/** Validate the batch size now; parse and simulate rows only as they are pulled. */
export function iterateBatch(input: string): IterableIterator<BatchResult> {
  if (Buffer.byteLength(input, "utf8") > MAX_BATCH_BYTES)
    throw new Error("Input exceeds 1 MiB.");
  return iterateRows(input);
}
function* iterateRows(input: string): IterableIterator<BatchResult> {
  for (let start = 0, number = 1; start <= input.length; number++) {
    const newline = input.indexOf("\n", start);
    const line = input.slice(start, newline === -1 ? input.length : newline);
    start = newline === -1 ? input.length + 1 : newline + 1;
    if (!line.trim()) continue;
    let scenario: unknown;
    try {
      scenario = JSON.parse(line);
    } catch {
      yield { line: number, ok: false, error: "Invalid JSON." };
      continue;
    }
    if (!validStrictScenario(scenario)) {
      yield { line: number, ok: false, error: "Invalid scenario." };
      continue;
    }
    yield { line: number, ok: true, scenario, result: simulate(scenario) };
  }
}
export function replayBatch(input: string): BatchResult[] {
  return [...iterateBatch(input)];
}
