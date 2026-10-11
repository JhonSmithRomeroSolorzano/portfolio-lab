import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRequestRate } from "../src/domain/simulation/request-rate.ts";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";
import { validStrictScenario } from "../src/domain/simulation/scenario-validation.ts";
import {
  scenarioFromSearch,
  scenarioUrl,
} from "../archive/signal-lab/scenario-url.ts";
test("fine-grained rates work consistently across input, URLs, and import validation", () => {
  for (const requestsPerSecond of [1, 21, 99, 100, 101, 599, 600]) {
    const s = { ...DEFAULT_SCENARIO, requestsPerSecond };
    assert.equal(
      parseRequestRate(String(requestsPerSecond)),
      requestsPerSecond,
    );
    assert.equal(validStrictScenario(s), true);
    assert.deepEqual(
      scenarioFromSearch(
        new URL(scenarioUrl("https://example.com/", s)).search,
      ),
      s,
    );
  }
  assert.equal(
    simulate({
      ...DEFAULT_SCENARIO,
      cacheEnabled: false,
      requestsPerSecond: 100,
    }).failed,
    0,
  );
  assert.equal(
    simulate({
      ...DEFAULT_SCENARIO,
      cacheEnabled: false,
      requestsPerSecond: 101,
    }).failed,
    1,
  );
});
test("invalid drafts never become a scenario", () => {
  for (const raw of ["", "0", "601", "1.5", "1e2", "-1", " ", "Infinity"])
    assert.equal(parseRequestRate(raw), null);
  assert.throws(
    () => simulate({ ...DEFAULT_SCENARIO, requestsPerSecond: 1.5 }),
    RangeError,
  );
});
