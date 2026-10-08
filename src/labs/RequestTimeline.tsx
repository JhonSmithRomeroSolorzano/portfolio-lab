import { useId, useState } from "react";
import type { ScheduledRequest } from "../request-scheduler";
import { requestTimeline } from "./request-timeline";

export function RequestTimeline({ rows }: { rows: ScheduledRequest[] }) {
  const [selected, setSelected] = useState(1);
  const id = useId();
  const { lanes, end } = requestTimeline(rows);
  const current = lanes.find((row) => row.id === selected) ?? lanes[0];
  if (!current) return null;
  return (
    <div className="request-timeline">
      <div className="timeline-caption">
        <strong>Where time goes</strong>
        <span>Striped: waiting · blue: working · ×: rejected</span>
      </div>
      <div className="timeline-axis" aria-hidden="true">
        <span>0 ms</span>
        <span>{end} ms</span>
      </div>
      <div className="request-lanes" aria-hidden="true">
        {lanes.map((row) => (
          <div
            className="request-lane"
            key={row.id}
            data-selected={row.id === current.id}
          >
            <span>{row.id}</span>
            <div className="request-track">
              <i
                className="request-wait"
                style={{ left: `${row.left}%`, width: `${row.waitWidth}%` }}
              />
              <i
                className="request-service"
                style={{
                  left: `${row.left + row.waitWidth}%`,
                  width: `${row.serviceWidth}%`,
                }}
              />
              {row.outcome !== "served" && (
                <b
                  className="request-end"
                  style={{ left: `${(row.finishedAt / end) * 100}%` }}
                >
                  {row.outcome === "rejected" ? "×" : "!"}
                </b>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="lab-field">
        <label htmlFor={id}>Inspect request</label>
        <select
          id={id}
          value={current.id}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {lanes.map((row) => (
            <option key={row.id} value={row.id}>
              Request {row.id} — {row.outcome}
            </option>
          ))}
        </select>
      </div>
      <p role="status">
        Request {current.id}: arrived at {current.arrivedAt} ms, waited{" "}
        {current.wait} ms, worked for {current.service} ms.{" "}
        {current.outcome === "timed-out"
          ? "Deadline reached (!)."
          : current.outcome === "rejected"
            ? "Rejected immediately (×)."
            : `Completed at ${current.finishedAt} ms.`}
      </p>
    </div>
  );
}
