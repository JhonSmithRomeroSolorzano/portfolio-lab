import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createSimulationServer } from "../server/api.ts";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation.ts";
test("HTTP service returns the shared model and validates its boundary", async (t) => {
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
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  assert.equal((await fetch(url + "/health")).status, 200);
  const post = (body: string, type = "application/json") =>
    fetch(url + "/v1/simulate", {
      method: "POST",
      headers: { "content-type": type },
      body,
    });
  const response = await post(JSON.stringify(DEFAULT_SCENARIO));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).result, simulate(DEFAULT_SCENARIO));
  for (const scenario of [
    {},
    null,
    { ...DEFAULT_SCENARIO, writePercent: 101 },
    { ...DEFAULT_SCENARIO, extra: true },
  ])
    assert.equal((await post(JSON.stringify(scenario))).status, 422);
  assert.equal((await post("{")).status, 400);
  assert.equal((await post("{}", "text/plain")).status, 415);
  assert.equal((await post(" ".repeat(17_000))).status, 413);
  const wrongMethod = await fetch(url + "/v1/simulate");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "POST");
  assert.equal((await fetch(url + "/missing")).status, 404);
});
