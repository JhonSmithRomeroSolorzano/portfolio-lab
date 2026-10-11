import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableRoutes,
  requestTrace,
} from "../src/domain/simulation/request-trace.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("trace durations agree with the model paths", () => {
  assert.equal(requestTrace(DEFAULT_SCENARIO, "cache").at(-1)?.at, 20);
  assert.equal(requestTrace(DEFAULT_SCENARIO, "database").at(-1)?.at, 92);
  assert.equal(
    requestTrace({ ...DEFAULT_SCENARIO, database: "offline" }, "timeout").at(-1)
      ?.at,
    1012,
  );
});
test("unavailable paths cannot be traced", () => {
  const offline = {
    ...DEFAULT_SCENARIO,
    cacheEnabled: false,
    database: "offline" as const,
  };
  assert.deepEqual(availableRoutes(offline), ["timeout"]);
  assert.throws(() => requestTrace(offline, "database"));
});
