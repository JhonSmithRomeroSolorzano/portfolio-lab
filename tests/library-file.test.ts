import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exportLibrary,
  importLibrary,
  mergeLibrary,
} from "../archive/signal-lab/library-file.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
const saved = {
  id: "local-only",
  name: "Baseline",
  scenario: DEFAULT_SCENARIO,
};
test("library backups omit local IDs and merge equivalent settings without duplicates", () => {
  const raw = exportLibrary([saved]);
  assert.ok(!raw.includes("local-only"));
  const incoming = importLibrary(raw);
  assert.equal(incoming.length, 1);
  assert.equal(
    mergeLibrary(
      [saved],
      [
        {
          ...incoming[0],
          scenario: { ...DEFAULT_SCENARIO, cacheHitPercent: 80 },
        },
      ],
    ).length,
    1,
  );
  assert.deepEqual(
    mergeLibrary([], incoming, () => "new-id"),
    [{ ...saved, id: "new-id" }],
  );
});
test("library imports reject invalid entries and overflow without partially replacing saves", () => {
  const raw = JSON.parse(exportLibrary([saved]));
  raw.experiments.push({ name: "bad", scenario: {} });
  assert.throws(() => importLibrary(JSON.stringify(raw)));
  assert.throws(() => importLibrary("x".repeat(100001)));
  const entries = Array.from({ length: 8 }, (_, i) => ({
    ...saved,
    id: String(i),
    name: String(i),
  }));
  assert.throws(() => mergeLibrary(entries, [{ ...saved, name: "New" }]));
  assert.equal(entries.length, 8);
});
