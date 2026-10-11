import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createRequestBudget } from "../server/request-budget.ts";
import { createSimulationServer } from "../server/api.ts";
import { DEFAULT_SCENARIO } from "../src/domain/simulation/simulation.ts";
test("fixed window rejects overflow and resets exactly at its boundary", () => {
  let time = 0;
  const consume = createRequestBudget({
    limit: 2,
    windowMs: 1500,
    now: () => time,
  });
  assert.equal(consume().remaining, 1);
  assert.equal(consume().remaining, 0);
  time = 500;
  assert.deepEqual(consume(), {
    allowed: false,
    limit: 2,
    remaining: 0,
    retryAfterSeconds: 1,
  });
  time = 1499;
  assert.equal(consume().allowed, false);
  time = 1500;
  assert.equal(consume().allowed, true);
  assert.throws(() => createRequestBudget({ limit: 0 }), RangeError);
});
test("HTTP budget limits simulations while health remains available", async (t) => {
  let time = 0;
  const server = createSimulationServer({
    budget: { limit: 2, now: () => time },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: unknown) =>
    fetch(url + "/v1/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal((await post({})).status, 422);
  assert.equal((await post(DEFAULT_SCENARIO)).status, 200);
  const limited = await post(DEFAULT_SCENARIO);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");
  assert.equal(limited.headers.get("x-ratelimit-remaining"), "0");
  assert.equal((await fetch(url + "/health")).status, 200);
  time = 60000;
  assert.equal((await post(DEFAULT_SCENARIO)).status, 200);
});
