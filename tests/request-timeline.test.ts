import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleRequests } from "../src/domain/simulation/request-scheduler.ts";
import { requestTimeline } from "../src/domain/simulation/request-timeline.ts";

test("timeline separates queued expiration, running timeout, and immediate rejection", () => {
  const { lanes, end } = requestTimeline(
    scheduleRequests(
      { concurrency: 1, serviceMs: 100, buffer: 1, deadlineMs: 50 },
      [0, 0, 0],
    ),
  );
  assert.equal(end, 50);
  assert.deepEqual(
    lanes.map((r) => [r.wait, r.service, r.waitWidth, r.serviceWidth]),
    [
      [0, 50, 0, 100],
      [50, 0, 100, 0],
      [0, 0, 0, 0],
    ],
  );
});
test("timeline keeps arrival offsets and conserved durations within a common axis", () => {
  const { lanes } = requestTimeline(
    scheduleRequests({ concurrency: 2, serviceMs: 100, buffer: 8 }),
  );
  for (const row of lanes) {
    assert.equal(row.wait + row.service, row.finishedAt - row.arrivedAt);
    assert.ok(row.left + row.waitWidth + row.serviceWidth <= 100 + 1e-10);
  }
  assert.deepEqual(requestTimeline([]), { end: 1, lanes: [] });
});
