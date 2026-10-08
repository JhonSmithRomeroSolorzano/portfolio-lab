import { useId, useState } from "react";
export interface LabEvent {
  at: number;
  title: string;
  detail: string;
  tone: "good" | "warning" | "neutral";
}
export function EventInspector({
  events,
  unit = "ms",
}: {
  events: LabEvent[];
  unit?: string;
}) {
  const [step, setStep] = useState(events.length - 1);
  const id = useId();
  if (!events.length) return <p>No events in this run.</p>;
  const index = Math.min(step, events.length - 1),
    event = events[index];
  return (
    <div className="event-inspector">
      <div className="event-ribbon" aria-hidden="true">
        {events.map((e, i) => (
          <span key={i} data-tone={e.tone} data-current={i === index} />
        ))}
      </div>
      <label htmlFor={id}>
        Inspect event{" "}
        <span>
          {index + 1} / {events.length}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={events.length - 1}
        value={index}
        onChange={(e) => setStep(Number(e.target.value))}
      />
      <div className="event-card" role="status" aria-atomic="true">
        <code>
          {event.at} {unit}
        </code>
        <strong>{event.title}</strong>
        <p>{event.detail}</p>
      </div>
      <details className="event-evidence">
        <summary>Read the complete event log</summary>
        <ol>
          {events.map((e, i) => (
            <li key={i}>
              <code>
                {e.at} {unit}
              </code>
              <div>
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
