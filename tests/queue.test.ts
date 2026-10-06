import { test } from "node:test";
import assert from "node:assert/strict";
import { queueTimeline } from "../src/queue-model.ts";
test("buffer absorbs a burst with explicit overflow and drains when capacity allows", () => {
  const rows = queueTimeline(8, 16);
  assert.equal(rows[3].rejected, 8);
  assert.equal(rows.at(-1)?.queued, 0);
  assert.equal(rows.at(-1)?.totalRejected, 8);
  assert.equal(queueTimeline(8, 0).at(-1)?.totalRejected, 24);
});
test("every tick conserves work across all supported queue sizes", () => {
  for (let capacity = 1; capacity <= 16; capacity++)
    for (let buffer = 0; buffer <= 40; buffer++)
      for (const row of queueTimeline(capacity, buffer)) {
        assert.equal(
          row.totalServed + row.totalRejected + row.queued,
          row.totalArrived,
        );
        assert.ok(row.queued <= buffer);
        assert.ok(row.served <= capacity);
      }
});
test("idle ticks drain backlog and invalid loads fail explicitly", () => {
  assert.deepEqual(
    queueTimeline(4, 10, [10, 0, 0]).map((r) => r.queued),
    [6, 2, 0],
  );
  for (const args of [
    [0, 4],
    [17, 4],
    [4, -1],
    [4, 41],
    [4, 1.5],
  ])
    assert.throws(
      () => queueTimeline(...(args as [number, number])),
      RangeError,
    );
  assert.throws(() => queueTimeline(4, 4, [-1]), RangeError);
});
