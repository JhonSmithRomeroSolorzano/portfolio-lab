import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rescueRun,
  rescueState,
  rescueSnapshot,
  rescueEvents,
} from "../src/domain/playground/cache-rescue.ts";
import {
  parseLabSetup,
  setupFromSearch,
  setupUrl,
  DEFAULT_LAB_SETTINGS,
} from "../archive/signal-lab/labs/lab-setup.ts";

test("simultaneous misses share one fetch and receive the same answer together", () => {
  const settings = { requests: 24, originMs: 400, spacingMs: 0 };
  const unprotected = rescueRun(settings, false),
    shared = rescueRun(settings, true);
  assert.equal(rescueSnapshot(unprotected, 0).queries, 24);
  assert.deepEqual(rescueSnapshot(shared, 0), {
    queries: 1,
    waiting: 23,
    done: 0,
    hits: 0,
  });
  assert.equal(shared.filter((r) => r.route === "shared").length, 23);
  assert.ok(shared.every((r) => r.completed === 400));
  assert.equal(rescueSnapshot(shared, 399).done, 0);
  assert.equal(rescueSnapshot(shared, 400).done, 24);
  assert.equal(rescueSnapshot(unprotected, 400).done, 24);
});

test("refills win ties and already-started duplicate work still finishes", () => {
  const settings = { requests: 6, originMs: 100, spacingMs: 25 };
  const unprotected = rescueRun(settings, false),
    shared = rescueRun(settings, true);
  assert.deepEqual(
    unprotected.map((r) => r.route),
    ["origin", "origin", "origin", "origin", "hit", "hit"],
  );
  assert.equal(unprotected[1].completed, 125);
  assert.equal(rescueState(unprotected[1], 100), "querying");
  assert.equal(rescueState(shared[1], 100), "done");
  assert.equal(shared[4].completed, 100);
  assert.equal(rescueState(shared[5], 100), "pending");
  assert.equal(rescueSnapshot(unprotected, 175).queries, 4);
});

test("without overlapping misses coordination saves no database reads", () => {
  const settings = { requests: 6, originMs: 100, spacingMs: 100 };
  assert.deepEqual(rescueRun(settings, false), rescueRun(settings, true));
});

test("all supported workloads conserve requests, bound reads, and expose every transition", () => {
  for (const requests of [6, 12, 18, 24, 30, 36])
    for (const originMs of [100, 200, 400, 800])
      for (const spacingMs of [0, 25, 50, 75]) {
        const settings = { requests, originMs, spacingMs };
        const runs = [rescueRun(settings, false), rescueRun(settings, true)];
        const times = rescueEvents(...runs);
        assert.equal(times[0], -25);
        const end = times.at(-1)!;
        for (const run of runs) {
          assert.equal(run.length, requests);
          assert.equal(rescueSnapshot(run, -25).done, 0);
          assert.equal(rescueSnapshot(run, end).done, requests);
          for (const r of run) {
            assert.ok(r.completed >= r.arrival);
            assert.ok(times.includes(r.arrival));
            assert.ok(times.includes(r.completed));
          }
          for (const at of times)
            assert.equal(
              ["pending", "waiting", "querying", "done"].reduce(
                (n, state) =>
                  n + run.filter((r) => rescueState(r, at) === state).length,
                0,
              ),
              requests,
            );
        }
        assert.equal(rescueSnapshot(runs[1], end).queries, 1);
        assert.equal(
          rescueSnapshot(runs[0], end).queries,
          spacingMs === 0
            ? requests
            : Math.min(requests, Math.ceil(originMs / spacingMs)),
        );
      }
});

test("rescue links preserve controls, reject invalid settings, and recompute results", () => {
  const settings = {
    ...DEFAULT_LAB_SETTINGS,
    rescue: { requests: 36, originMs: 800, spacingMs: 50 },
  };
  const url = new URL(
    setupUrl("https://example.test/?lab=rescue#lab", "rescue", settings),
  );
  assert.deepEqual(
    setupFromSearch(url.search).setup?.settings,
    settings.rescue,
  );
  for (const bad of [
    { requests: 37 },
    { requests: 7 },
    { originMs: 99 },
    { spacingMs: 10 },
    { reads: 1 },
  ]) {
    assert.equal(
      parseLabSetup(
        JSON.stringify({
          version: 1,
          lab: "rescue",
          settings: { ...settings.rescue, ...bad },
        }),
      ),
      null,
    );
  }
  for (const bad of [
    { requests: 0 },
    { requests: 10000 },
    { originMs: NaN },
    { spacingMs: -1 },
  ]) {
    assert.throws(
      () => rescueRun({ ...settings.rescue, ...bad }, true),
      RangeError,
    );
  }
});
