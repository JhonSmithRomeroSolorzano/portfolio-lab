import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";

test("a warm cache keeps default demand below database capacity", () => {
  const result = simulate(DEFAULT_SCENARIO);
  assert.equal(result.databaseDemand, 24);
  assert.equal(result.successPercent, 100);
  assert.equal(result.status, "healthy");
  assert.ok(Math.abs(result.meanLatencyMs - 34.4) < 0.001);
});

test("a slow database exposes saturation and preserves the request budget", () => {
  const result = simulate({
    requestsPerSecond: 200,
    cacheEnabled: false,
    database: "slow",
  });
  assert.equal(result.databaseCapacity, 20);
  assert.equal(result.successful, 20);
  assert.equal(result.failed, 180);
  assert.equal(result.meanLatencyMs, 952);
  assert.equal(result.status, "overloaded");
  assert.equal(
    result.cacheHits + result.databaseServed + result.failed,
    result.offered,
  );
});

test("warm cache only protects cached reads during an outage", () => {
  const cached = simulate({ ...DEFAULT_SCENARIO, database: "offline" });
  const uncached = simulate({
    ...DEFAULT_SCENARIO,
    database: "offline",
    cacheEnabled: false,
  });
  assert.equal(cached.successPercent, 80);
  assert.equal(cached.status, "degraded");
  assert.equal(uncached.successful, 0);
  assert.equal(uncached.meanLatencyMs, 1012);
  assert.equal(uncached.status, "unavailable");
});

test("the connection pool serves its boundary without dropping requests", () => {
  const atCapacity = simulate({
    requestsPerSecond: 100,
    cacheEnabled: false,
    database: "normal",
  });
  const aboveCapacity = simulate({
    requestsPerSecond: 101,
    cacheEnabled: false,
    database: "normal",
  });
  assert.equal(atCapacity.failed, 0);
  assert.equal(atCapacity.status, "healthy");
  assert.equal(aboveCapacity.failed, 1);
  assert.equal(aboveCapacity.status, "overloaded");
});

test("all supported scenarios have bounded, finite results and conserve requests", () => {
  for (const database of ["normal", "slow", "offline"] as const) {
    for (const cacheEnabled of [true, false]) {
      for (
        let requestsPerSecond = 20;
        requestsPerSecond <= 600;
        requestsPerSecond += 20
      ) {
        const result = simulate({ requestsPerSecond, cacheEnabled, database });
        assert.ok(Number.isFinite(result.meanLatencyMs));
        assert.ok(result.successPercent >= 0 && result.successPercent <= 100);
        assert.ok(
          Math.abs(
            result.cacheHits +
              result.databaseServed +
              result.failed -
              requestsPerSecond,
          ) < 0.001,
        );
      }
    }
  }
});

test("invalid rates fail explicitly rather than producing misleading metrics", () => {
  for (const requestsPerSecond of [NaN, Infinity, -1, 0, 601]) {
    assert.throws(
      () => simulate({ ...DEFAULT_SCENARIO, requestsPerSecond }),
      RangeError,
    );
  }
});
