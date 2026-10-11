import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
import {
  scenarioFromSearch,
  scenarioUrl,
} from "../archive/signal-lab/scenario-url.ts";

test("empty and unrelated query strings use the default scenario", () => {
  assert.deepEqual(scenarioFromSearch(""), DEFAULT_SCENARIO);
  assert.deepEqual(scenarioFromSearch("?utm_source=github"), DEFAULT_SCENARIO);
});

test("all UI scenarios survive a URL round trip on a project subpath", () => {
  for (const database of ["normal", "slow", "offline"] as const) {
    for (const cacheEnabled of [true, false]) {
      for (
        let requestsPerSecond = 20;
        requestsPerSecond <= 600;
        requestsPerSecond += 20
      ) {
        const scenario = { requestsPerSecond, cacheEnabled, database };
        const url = new URL(
          scenarioUrl("https://example.com/portfolio-lab/", scenario),
        );
        assert.equal(url.pathname, "/portfolio-lab/");
        assert.deepEqual(scenarioFromSearch(url.search), scenario);
      }
    }
  }
});

test("invalid or ambiguous fields fall back without discarding valid ones", () => {
  for (const traffic of [
    "",
    "0",
    "-20",
    "601",
    "20.5",
    "Infinity",
    "2e2",
    "0x28",
    "NaN",
    "999999999999999999",
  ]) {
    assert.deepEqual(
      scenarioFromSearch(`?traffic=${traffic}&cache=off&database=slow`),
      {
        ...DEFAULT_SCENARIO,
        cacheEnabled: false,
        database: "slow",
      },
    );
  }
  assert.deepEqual(
    scenarioFromSearch(
      "?traffic=20&traffic=600&cache=off&cache=on&database=slow&database=offline",
    ),
    DEFAULT_SCENARIO,
  );
  assert.deepEqual(
    scenarioFromSearch("?cache=perhaps&database=__proto__"),
    DEFAULT_SCENARIO,
  );
});

test("reset removes all scenario parameters but preserves unrelated context", () => {
  const url = new URL(
    scenarioUrl(
      "https://example.com/portfolio-lab/?utm_source=github&traffic=600&cache=off&database=offline#lab",
      DEFAULT_SCENARIO,
    ),
  );
  assert.equal(url.search, "?utm_source=github");
  assert.equal(url.hash, "#lab");
  assert.equal(url.pathname, "/portfolio-lab/");
});
