import type { ScheduledRequest } from "../request-scheduler";

export function requestTimeline(rows: ScheduledRequest[]) {
  const end = Math.max(1, ...rows.map((row) => row.finishedAt));
  return {
    end,
    lanes: rows.map((row) => ({
      ...row,
      wait: (row.startedAt ?? row.finishedAt) - row.arrivedAt,
      service: row.startedAt === null ? 0 : row.finishedAt - row.startedAt,
      left: (row.arrivedAt / end) * 100,
      waitWidth:
        (((row.startedAt ?? row.finishedAt) - row.arrivedAt) / end) * 100,
      serviceWidth:
        (row.startedAt === null ? 0 : (row.finishedAt - row.startedAt) / end) *
        100,
    })),
  };
}
