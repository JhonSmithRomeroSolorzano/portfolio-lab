import { useEffect, useId, useState } from "react";
export interface LabEvent {
  at: number;
  title: string;
  detail: string;
  tone: "good" | "warning" | "neutral";
}
export function EventInspector({
  events,
  active,
  unit = "ms",
}: {
  events: LabEvent[];
  active: boolean;
  unit?: string;
}) {
  const [step, setStep] = useState(events.length - 1);
  const [playing, setPlaying] = useState(false);
  const [interval, setInterval] = useState(1000);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const signature = JSON.stringify(events);
  const count = events.length;
  const id = useId();
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(motion.matches);
      if (motion.matches) setPlaying(false);
    };
    motion.addEventListener("change", change);
    const visibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    setPlaying(false);
    setStep(count - 1);
  }, [signature, count]);
  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);
  useEffect(() => {
    if (!playing || !active || reduced || !count) return;
    if (step >= count - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStep((current) => current + 1),
      interval,
    );
    return () => window.clearTimeout(timer);
  }, [playing, active, reduced, step, count, interval, signature]);
  function inspect(next: number) {
    setPlaying(false);
    setStep(next);
  }

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
        onChange={(e) => inspect(Number(e.target.value))}
      />
      <div className="event-playback">
        <button onClick={() => inspect(0)} disabled={index === 0}>
          First event
        </button>
        <button onClick={() => inspect(index - 1)} disabled={index === 0}>
          Previous event
        </button>
        <button
          disabled={reduced || count < 2}
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (index === count - 1) setStep(0);
              setPlaying(true);
            }
          }}
        >
          {playing ? "Pause events" : "Play events"}
        </button>
        <button
          onClick={() => inspect(index + 1)}
          disabled={index === count - 1}
        >
          Next event
        </button>
        <label htmlFor={`${id}-speed`}>Playback pace</label>
        <select
          id={`${id}-speed`}
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
        >
          <option value={1500}>Slow</option>
          <option value={1000}>Normal</option>
          <option value={500}>Fast</option>
        </select>
      </div>
      <p className="playback-note">
        {reduced
          ? "Reduced motion is on. Use the manual event controls."
          : "Playback advances one event at a time; it does not represent elapsed simulation time."}
      </p>
      <div
        className="event-card"
        role="status"
        aria-atomic="true"
        aria-live={playing ? "off" : "polite"}
      >
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
