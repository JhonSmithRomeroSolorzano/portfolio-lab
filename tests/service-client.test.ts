import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createSimulationServer } from "../server/api.ts";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";
import {
  runServiceScenario,
  sameScenario,
  ServiceError,
  validateServiceReply,
} from "../archive/signal-lab/service-client.ts";
const scenario = DEFAULT_SCENARIO;
const envelope = () => ({
  model: "signal-lab/1",
  scenario,
  result: simulate(scenario),
});
const response = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "x-request-id": "test-123" },
    ...init,
  });
const fetcher =
  (body: unknown): typeof fetch =>
  async () =>
    response(body);

test("client sends a snapshot without credentials and validates all response metrics", async () => {
  const sent = { ...scenario };
  const reply = await runServiceScenario(sent, {
    fetcher: async (url, init) => {
      assert.equal(url, "/local-api/v1/simulate");
      assert.equal(init?.credentials, "omit");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.deepEqual(JSON.parse(String(init?.body)), scenario);
      sent.requestsPerSecond = 600;
      return response(envelope());
    },
  });
  assert.deepEqual(reply.result, simulate(scenario));
  assert.equal(reply.requestId, "test-123");
  assert.ok(reply.roundTripMs >= 0);
});
test("defaulted scenario echoes are equivalent, but changed controls are not", () => {
  assert.equal(
    sameScenario(scenario, {
      ...scenario,
      cacheHitPercent: 80,
      writePercent: 0,
      databaseConnections: 8,
    }),
    true,
  );
  assert.equal(
    sameScenario(scenario, { ...scenario, databaseConnections: 9 }),
    false,
  );
});
test("wrong scenarios, model versions, missing fields, and nonfinite or drifted results are rejected", () => {
  for (const body of [
    null,
    {},
    { ...envelope(), model: "signal-lab/2" },
    { ...envelope(), scenario: { ...scenario, requestsPerSecond: 121 } },
    { ...envelope(), result: {} },
    ...[NaN, Infinity, -1, "34.4", 35].map((meanLatencyMs) => ({
      ...envelope(),
      result: { ...simulate(scenario), meanLatencyMs },
    })),
    { ...envelope(), result: { ...simulate(scenario), status: "unavailable" } },
  ])
    assert.throws(() => validateServiceReply(body, scenario), ServiceError);
});
test("client bounds replies and distinguishes HTML, malformed JSON, and unavailable services", async () => {
  const cases: [typeof fetch, string][] = [
    [async () => new Response("<html>offline</html>"), "protocol"],
    [
      async () =>
        new Response("{", { headers: { "content-type": "application/json" } }),
      "protocol",
    ],
    [fetcher("a".repeat(66_000)), "protocol"],
    [
      async () => {
        throw new TypeError("fetch failed");
      },
      "offline",
    ],
  ];
  for (const [fetcher, kind] of cases)
    await assert.rejects(
      runServiceScenario(scenario, { fetcher }),
      (e: unknown) => e instanceof ServiceError && e.kind === kind,
    );
});
test("rate limiting surfaces bounded retry metadata and request identity without automatic retries", async () => {
  let calls = 0;
  await assert.rejects(
    runServiceScenario(scenario, {
      fetcher: async () => {
        calls++;
        return response(
          {},
          {
            status: 429,
            headers: { "retry-after": "12", "x-request-id": "budget-1" },
          },
        );
      },
    }),
    (e: unknown) =>
      e instanceof ServiceError &&
      e.retryAfterSeconds === 12 &&
      e.requestId === "budget-1",
  );
  assert.equal(calls, 1);
});
test("aborts, pre-aborts, and deadlines stop requests and remain distinct from offline failures", async () => {
  const pending: typeof fetch = async (_, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(init.signal?.reason),
        { once: true },
      );
    });
  const controller = new AbortController();
  const result = runServiceScenario(scenario, {
    fetcher: pending,
    signal: controller.signal,
  });
  controller.abort();
  await assert.rejects(
    result,
    (e: unknown) => e instanceof ServiceError && e.kind === "cancelled",
  );
  await assert.rejects(
    runServiceScenario(scenario, {
      signal: controller.signal,
      fetcher: async () => {
        assert.fail("pre-aborted request must not fetch");
      },
    }),
    (e: unknown) => e instanceof ServiceError && e.kind === "cancelled",
  );
  await assert.rejects(
    runServiceScenario(scenario, { fetcher: pending, timeoutMs: 5 }),
    (e: unknown) => e instanceof ServiceError && e.kind === "timeout",
  );
});
test("client agrees with the real local service across normal, overloaded, and offline scenarios", async (t) => {
  const server = createSimulationServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  for (const s of [
    scenario,
    { ...scenario, requestsPerSecond: 600, cacheEnabled: false },
    { ...scenario, database: "offline" as const, writePercent: 30 },
  ]) {
    const reply = await runServiceScenario(s, {
      fetcher: (url, init) =>
        fetch(String(url).replace("/local-api", base), init),
    });
    assert.deepEqual(reply.result, simulate(s));
    assert.match(reply.requestId ?? "", /^[a-f0-9-]{36}$/);
  }
});
