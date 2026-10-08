import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseLibrary,
  renameExperiment,
  updateExperiment,
} from "../src/experiment-library.ts";
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

test("rename and update preserve saved identity, order, and unrelated experiments", () => {
  const entries = [
    { id: "a", name: "Old", scenario: DEFAULT_SCENARIO },
    { id: "b", name: "Other", scenario: DEFAULT_SCENARIO },
  ];
  const renamed = renameExperiment(entries, "a", "  New  ");
  assert.equal(renamed[0].name, "New");
  assert.equal(entries[0].name, "Old");
  assert.equal(renamed[1], entries[1]);
  const scenario = { ...DEFAULT_SCENARIO, requestsPerSecond: 200 };
  const updated = updateExperiment(renamed, "a", scenario);
  scenario.requestsPerSecond = 300;
  assert.equal(updated[0].scenario.requestsPerSecond, 200);
  assert.equal(updated[0].id, "a");
  assert.throws(() => renameExperiment(entries, "a", " "));
  assert.throws(() => updateExperiment(entries, "missing", DEFAULT_SCENARIO));
});
