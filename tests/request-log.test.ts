import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createSimulationServer } from "../server/api.ts";
import type { RequestLog } from "../server/api.ts";
test("completed requests correlate to safe structured logs", async (t) => {
  const entries: RequestLog[] = [];
  const server = createSimulationServer({
    logger: (entry) => entries.push(entry),
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
  const responses = await Promise.all([
    fetch(url + "/health?token=secret", {
      headers: { "x-request-id": "untrusted", cookie: "secret" },
    }),
    fetch(url + "/secret-user-path"),
  ]);
  assert.equal(entries.length, 2);
  const ids = responses.map((r) => r.headers.get("x-request-id"));
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) {
    assert.match(id!, /^[a-f0-9-]{36}$/);
    assert.ok(entries.some((e) => e.requestId === id));
  }
  assert.ok(
    entries.every((e) => e.durationMs >= 0 && Number.isFinite(e.durationMs)),
  );
  assert.deepEqual(entries.map((e) => e.route).sort(), [
    "/health",
    "unmatched",
  ]);
  assert.equal(JSON.stringify(entries).includes("secret"), false);
});
