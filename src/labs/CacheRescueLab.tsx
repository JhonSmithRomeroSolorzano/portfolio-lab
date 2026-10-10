import { useEffect, useMemo, useState } from "react";
import { useIndependentLab } from "./LabSettingsProvider";
import { LabRange, LabChoice } from "./LabControls";
import {
  rescueRun,
  rescueState,
  rescueSnapshot,
  rescueEvents,
} from "./cache-rescue";
import type { RescueRequest, RescueState } from "./cache-rescue";

const ROWS: { state: RescueState; label: string; y: number }[] = [
  { state: "pending", label: "Not arrived yet", y: 22 },
  { state: "waiting", label: "Sharing the first fetch", y: 84 },
  { state: "querying", label: "Fetching from the database", y: 146 },
  { state: "done", label: "Response received", y: 208 },
];

function RescueLane({
  run,
  time,
  shared,
  warm,
}: {
  run: RescueRequest[];
  time: number;
  shared: boolean;
  warm: boolean;
}) {
  const counts = rescueSnapshot(run, time);
  return (
    <div className={`rescue-lane ${shared ? "is-shared" : ""}`}>
      <div className="rescue-lane-title">
        <h4>{shared ? "Share one fetch" : "Fetch on every miss"}</h4>
        <span>{warm ? "Cache warm" : "Cache expired"}</span>
      </div>
      <div
        className="rescue-flow"
        role="img"
        aria-label={`${shared ? "Shared fetch" : "Every miss"}: ${counts.queries} database reads started, ${counts.waiting} waiting, ${counts.done} responses received.`}
      >
        {ROWS.map((row) => (
          <div
            key={row.state}
            className="rescue-station"
            style={{ top: row.y }}
          >
            <span>{row.label}</span>
          </div>
        ))}
        {run.map((r, index) => {
          const state = rescueState(r, time);
          const row = ROWS.find((row) => row.state === state)!;
          return (
            <span
              key={r.id}
              className={`rescue-dot is-${state} ${r.route === "origin" && state !== "pending" ? "is-origin" : ""}`}
              style={{
                left: `${4 + (index % 12) * 8.3}%`,
                transform: `translateY(${row.y + 7 + Math.floor(index / 12) * 12}px)`,
              }}
            />
          );
        })}
      </div>
      <dl className="rescue-counters">
        <div>
          <dt>Database reads</dt>
          <dd
            data-testid={shared ? "rescue-shared-reads" : "rescue-every-reads"}
          >
            {counts.queries}
          </dd>
        </div>
        <div>
          <dt>Responses</dt>
          <dd>
            {counts.done}
            <small> / {run.length}</small>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function CacheRescueLab({ active }: { active: boolean }) {
  const [settings, update] = useIndependentLab("rescue");
  const { requests, originMs, spacingMs } = settings;
  const runs = useMemo(
    () => [rescueRun(settings, false), rescueRun(settings, true)],
    [requests, originMs, spacingMs],
  );
  const events = useMemo(() => rescueEvents(...runs), [runs]);
  const end = events[events.length - 1];
  const [time, setTime] = useState(-25);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    setPlaying(false);
    setTime(-25);
  }, [requests, originMs, spacingMs]);
  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    const visibility = () => {
      if (document.hidden) setPlaying(false);
    };
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (!playing || !active || reduced) return;
    // Playback is a five-second inspection aid, independent of modeled time.
    const timer = window.setInterval(
      () => setTime((t) => Math.min(end, t + 25)),
      5000 / ((end + 25) / 25),
    );
    return () => window.clearInterval(timer);
  }, [playing, active, reduced, end]);
  useEffect(() => {
    if (time >= end) setPlaying(false);
  }, [time, end]);
  function inspect(t: number) {
    setPlaying(false);
    setTime(t);
  }
  const [every, shared] = runs.map((run) => rescueSnapshot(run, time));
  const finished = time >= end;
  const avoided = every.queries - shared.queries;
  return (
    <section
      className={`cache-rescue ${playing ? "is-playing" : ""}`}
      aria-labelledby="rescue-title"
    >
      <div className="rescue-heading">
        <span className="rescue-kicker">
          CACHE RESCUE / AN INTERACTIVE COMPARISON
        </span>
        <h3 id="rescue-title" tabIndex={-1}>
          One expired key.
          <br />A crowd of requests.
        </h3>
        <p>
          Send the same burst through two systems. Watch each request fetch its
          own copy—or wait together for one shared answer.
        </p>
      </div>
      <div className="rescue-controls">
        <LabRange
          label="Requests in the burst"
          value={requests}
          min={6}
          max={36}
          step={6}
          onChange={(requests) => update({ requests })}
        />
        <LabRange
          label="Database fetch time"
          value={originMs}
          min={100}
          max={800}
          step={100}
          unit=" ms"
          onChange={(originMs) => update({ originMs })}
        />
        <LabChoice
          label="Time between arrivals"
          value={String(spacingMs)}
          options={[
            { value: "0", label: "All at once" },
            { value: "25", label: "25 ms apart" },
            { value: "50", label: "50 ms apart" },
            { value: "75", label: "75 ms apart" },
          ]}
          onChange={(value) => update({ spacingMs: Number(value) })}
        />
      </div>
      <div className="rescue-transport">
        <button
          className="rescue-launch"
          onClick={() => {
            if (reduced) inspect(end);
            else if (playing) setPlaying(false);
            else {
              if (finished) setTime(-25);
              setPlaying(true);
            }
          }}
        >
          {reduced
            ? "Show burst result"
            : playing
              ? "Pause burst"
              : time < 0
                ? "Expire cache & send burst"
                : finished
                  ? "Replay burst"
                  : "Resume burst"}
        </button>
        <button disabled={time < 0} onClick={() => inspect(-25)}>
          Reset burst
        </button>
        <button
          disabled={finished}
          onClick={() => inspect(events.find((at) => at > time) ?? end)}
        >
          Next event
        </button>
        <output aria-live="off">
          {time < 0 ? "Ready" : `${time} ms`}
          <span>MODELED TIME</span>
        </output>
      </div>
      <div className="rescue-arena">
        <RescueLane
          run={runs[0]}
          time={time}
          shared={false}
          warm={time >= originMs}
        />
        <RescueLane run={runs[1]} time={time} shared warm={time >= originMs} />
      </div>
      <div className="rescue-scrubber">
        <label htmlFor="rescue-time">Inspect the burst</label>
        <input
          id="rescue-time"
          type="range"
          min={-25}
          max={end}
          step={25}
          value={time}
          onChange={(e) => inspect(Number(e.target.value))}
        />
      </div>
      <p
        className="rescue-result"
        role="status"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="true"
      >
        {time < 0
          ? "Both caches start expired. Each dot is one request; a ring marks a database fetch."
          : `${finished ? "Complete. " : "So far: "}${avoided} duplicate database ${avoided === 1 ? "read" : "reads"} avoided. ${shared.done} of ${requests} responses received with shared fetching.${finished ? ` ${shared.hits} later arrivals used the refilled cache.` : ""}`}
      </p>
      <p className="rescue-note">
        {reduced
          ? "Reduced motion is on. Step, scrub, or show the result without animation."
          : "Playback is slowed for inspection. Step or scrub to compare any moment."}
      </p>
      <details className="rescue-explanation">
        <summary>What is happening?</summary>
        <p>
          Once the first fetch finishes, the key is warm again. Without
          coordination, every earlier miss starts an identical database read.
          With single-flight, the first request fetches and the other misses
          share its result. Later arrivals use the cache.
        </p>
        <p>
          This browser model uses one key and one coordinator, constant fetch
          time, unlimited parallel database work, and instantaneous cache hits.
          Every fetch succeeds. Refills happen before arrivals at the same
          timestamp. It does not model timeouts, distributed locks, failures, or
          production latency.
        </p>
        <p>
          Sharing a fetch reduces duplicate work; it does not make the first
          database read faster. With few overlapping misses, there is less work
          to avoid.
        </p>
      </details>
    </section>
  );
}
