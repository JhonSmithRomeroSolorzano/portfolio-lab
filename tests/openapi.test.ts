import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import spec from "../server/openapi.json" with { type: "json" };
import { createSimulationServer } from "../server/api.ts";
import { validStrictScenario } from "../src/domain/simulation/scenario-validation.ts";
test("published contract agrees with live responses and documented input boundaries", async (t) => {
  const server = createSimulationServer({ budget: { limit: 1 } });
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
  assert.deepEqual(await (await fetch(url + "/openapi.json")).json(), spec);
  const example =
    spec.paths["/v1/simulate"].post.requestBody.content["application/json"]
      .example;
  assert.equal(validStrictScenario(example), true);
  const response = await fetch(url + "/v1/simulate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(example),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(
    Object.keys(body).sort(),
    spec.components.schemas.SimulationResponse.required.slice().sort(),
  );
  assert.deepEqual(
    Object.keys(body.result).sort(),
    spec.components.schemas.Result.required.slice().sort(),
  );
  for (const [field, rule] of Object.entries(
    spec.components.schemas.Scenario.properties,
  )) {
    if ("minimum" in rule && "maximum" in rule) {
      for (const value of [rule.minimum, rule.maximum])
        assert.equal(validStrictScenario({ ...example, [field]: value }), true);
      for (const value of [rule.minimum - 1, rule.maximum + 1])
        assert.equal(
          validStrictScenario({ ...example, [field]: value }),
          false,
        );
    }
  }
  assert.equal((await fetch(url + "/openapi.json")).status, 200);
  assert.equal(
    (await fetch(url + "/openapi.json", { method: "POST" })).status,
    405,
  );
});
