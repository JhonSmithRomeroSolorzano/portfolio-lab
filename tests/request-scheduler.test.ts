import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleRequests } from "../src/domain/simulation/request-scheduler.ts";
test("scheduler reserves bounded waiting and reuses a worker at exact completion", () => {
  const rows = scheduleRequests(
    { concurrency: 1, serviceMs: 100, buffer: 1 },
    [0, 0, 0, 100],
  );
  assert.deepEqual(
    rows.map((r) => [r.startedAt, r.finishedAt, r.outcome]),
    [
      [0, 100, "served"],
      [100, 200, "served"],
      [null, 0, "rejected"],
      [200, 300, "served"],
    ],
  );
});
test("scheduler conserves requests and never overlaps more than the configured workers", () => {
  for (const concurrency of [1, 2, 8])
    for (const buffer of [0, 8, 40]) {
      const rows = scheduleRequests({ concurrency, serviceMs: 130, buffer });
      assert.equal(rows.length, 16);
      for (const r of rows.filter((r) => r.startedAt !== null)) {
        assert.ok(r.startedAt! >= r.arrivedAt);
        assert.equal(r.finishedAt - r.startedAt!, 130);
        const active = rows.filter(
          (x) =>
            x.startedAt !== null &&
            x.startedAt <= r.startedAt! &&
            x.finishedAt > r.startedAt!,
        );
        assert.ok(active.length <= concurrency);
      }
    }
  assert.deepEqual(
    scheduleRequests({ concurrency: 1, serviceMs: 10, buffer: 0 }, []),
    [],
  );
  assert.throws(() =>
    scheduleRequests({ concurrency: 1, serviceMs: 10, buffer: 0 }, [10, 0]),
  );
});

test("deadlines cancel queued and running work while exact-boundary completion succeeds", () => {
  const rows = scheduleRequests(
    { concurrency: 1, serviceMs: 100, buffer: 1, deadlineMs: 50 },
    [0, 0, 50],
  );
  assert.deepEqual(
    rows.map((r) => [r.startedAt, r.finishedAt, r.outcome]),
    [
      [0, 50, "timed-out"],
      [null, 50, "timed-out"],
      [50, 100, "timed-out"],
    ],
  );
  const exact = scheduleRequests(
    { concurrency: 1, serviceMs: 100, buffer: 1, deadlineMs: 100 },
    [0, 100],
  );
  assert.ok(exact.every((r) => r.outcome === "served"));
});
test("deadlines conserve requests and never finish after their cutoff", () => {
  for (const deadlineMs of [1, 100, 500]) {
    const rows = scheduleRequests({
      concurrency: 2,
      serviceMs: 100,
      buffer: 8,
      deadlineMs,
    });
    assert.equal(rows.length, 16);
    assert.equal(new Set(rows.map((r) => r.id)).size, 16);
    assert.ok(rows.every((r) => r.finishedAt <= r.arrivedAt + deadlineMs));
  }
});
