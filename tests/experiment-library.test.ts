import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLibrary } from "../src/experiment-library.ts";
import { DEFAULT_SCENARIO } from "../src/simulation.ts";
test("corrupt browser storage is harmless and invalid entries are ignored", () => {
  assert.deepEqual(parseLibrary("{"), []);
  assert.deepEqual(parseLibrary("{}"), []);
  const entry = { id: "a", name: "Baseline", scenario: DEFAULT_SCENARIO };
  const raw = JSON.stringify([
    null,
    entry,
    entry,
    {
      ...entry,
      id: "b",
      scenario: { ...DEFAULT_SCENARIO, requestsPerSecond: Infinity },
    },
  ]);
  assert.deepEqual(parseLibrary(raw), [entry]);
});
test("library size is bounded and meaningful names are required", () => {
  assert.equal(
    parseLibrary(
      JSON.stringify(
        Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          name: "Setup",
          scenario: DEFAULT_SCENARIO,
        })),
      ),
    ).length,
    8,
  );
  assert.deepEqual(
    parseLibrary(
      JSON.stringify([{ id: "a", name: " ", scenario: DEFAULT_SCENARIO }]),
    ),
    [],
  );
});
