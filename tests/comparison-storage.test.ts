import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASELINE_KEY,
  parseBaseline,
  saveBaseline,
} from "../archive/signal-lab/comparison-storage.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("saved baselines round trip and can be cleared", () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: (k: string) => {
      values.delete(k);
    },
  };
  assert.equal(saveBaseline(DEFAULT_SCENARIO, storage), true);
  assert.deepEqual(parseBaseline(values.get(BASELINE_KEY)!), DEFAULT_SCENARIO);
  saveBaseline(null, storage);
  assert.equal(values.size, 0);
});
test("baseline corruption and unknown versions cannot restore invalid controls", () => {
  for (const raw of [
    null,
    "{",
    "{}",
    JSON.stringify({ version: 2, scenario: DEFAULT_SCENARIO }),
    JSON.stringify({
      version: 1,
      scenario: { ...DEFAULT_SCENARIO, requestsPerSecond: 0 },
    }),
  ])
    assert.equal(parseBaseline(raw), null);
  assert.equal(
    saveBaseline(DEFAULT_SCENARIO, {
      setItem() {
        throw Error("quota");
      },
      removeItem() {
        throw Error("blocked");
      },
    }),
    false,
  );
});
