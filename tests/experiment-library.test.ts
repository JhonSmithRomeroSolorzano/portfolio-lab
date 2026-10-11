import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseLibrary,
  libraryFromStorageEvent,
  LIBRARY_KEY,
  restoreExperiment,
  renameExperiment,
  updateExperiment,
} from "../archive/signal-lab/experiment-library.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
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

test("undo restores the original position without overwriting newer saves", () => {
  const a = { id: "a", name: "A", scenario: DEFAULT_SCENARIO },
    b = { ...a, id: "b" },
    c = { ...a, id: "c" };
  assert.deepEqual(
    restoreExperiment([a, c], b, 1).map((e) => e.id),
    ["a", "b", "c"],
  );
  assert.throws(() => restoreExperiment([a], a, 0));
  assert.throws(() =>
    restoreExperiment(
      Array.from({ length: 8 }, (_, i) => ({ ...a, id: String(i) })),
      b,
      0,
    ),
  );
});

test("library storage events distinguish another feature from a clear or update", () => {
  const entries = [{ id: "a", name: "A", scenario: DEFAULT_SCENARIO }];
  assert.deepEqual(
    libraryFromStorageEvent({
      key: LIBRARY_KEY,
      newValue: JSON.stringify(entries),
    }),
    entries,
  );
  assert.equal(
    libraryFromStorageEvent({ key: "portfolio-theme", newValue: null }),
    null,
  );
  assert.deepEqual(
    libraryFromStorageEvent({ key: LIBRARY_KEY, newValue: null }),
    [],
  );
  assert.deepEqual(libraryFromStorageEvent({ key: null, newValue: null }), []);
});
