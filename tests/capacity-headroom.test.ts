import { test } from "node:test";
import assert from "node:assert/strict";
import { capacityHeadroom } from "../src/capacity-headroom.ts";
import { DEFAULT_SCENARIO, simulate } from "../src/simulation.ts";
test("analytical capacity agrees with the exact failure boundary", () => {
  for (const database of ["normal", "slow"] as const)
    for (const cacheEnabled of [false, true])
      for (const writePercent of [0, 40, 100]) {
        const s = { ...DEFAULT_SCENARIO, database, cacheEnabled, writePercent };
        const h = capacityHeadroom(s);
        const max = h.maximumTraffic!;
        if (max >= 1 && max < 600) {
          assert.ok(simulate({ ...s, requestsPerSecond: max }).failed < 1e-9);
          assert.ok(simulate({ ...s, requestsPerSecond: max + 1 }).failed > 0);
        }
      }
  const h = capacityHeadroom(DEFAULT_SCENARIO);
  assert.equal(h.maximumTraffic, 500);
  assert.equal(h.minimumConnections, 2);
  assert.equal(h.spareDatabaseCapacity, 76);
});
test("offline and fully cached workloads avoid false finite capacity claims", () => {
  const offline = capacityHeadroom({
    ...DEFAULT_SCENARIO,
    database: "offline",
  });
  assert.equal(offline.maximumTraffic, 0);
  assert.equal(offline.minimumConnections, null);
  const cached = capacityHeadroom({
    ...DEFAULT_SCENARIO,
    cacheHitPercent: 100,
  });
  assert.equal(cached.maximumTraffic, null);
  assert.equal(cached.minimumConnections, 0);
});
