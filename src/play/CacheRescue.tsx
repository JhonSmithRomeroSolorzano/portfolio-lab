import { useEffect, useMemo, useRef, useState } from "react";
import { rescueRun, rescueSnapshot, rescueState } from "../labs/cache-rescue";

export const ROUNDS = [
  {
    name: "The morning rush",
    requests: 24,
    originMs: 400,
    spacingMs: 0,
    note: "Everyone arrives at once. The cache is empty. Keep the database work to one read.",
  },
  {
    name: "A rolling wave",
    requests: 24,
    originMs: 400,
    spacingMs: 25,
    note: "Requests keep arriving while the first fetch is running. Can they share its answer?",
  },
  {
    name: "Room to breathe",
    requests: 12,
    originMs: 100,
    spacingMs: 100,
    note: "Arrivals are farther apart. Try both strategies. Does sharing still save any work?",
  },
] as const;

export function CacheRescue() {
  const [round, setRound] = useState(0);
  const [shared, setShared] = useState(false);
  const [time, setTime] = useState(-25);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const arena = useRef<HTMLDivElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const settings = ROUNDS[round];
  const run = useMemo(() => rescueRun(settings, shared), [settings, shared]);
  const end = Math.max(...run.map((r) => r.completed));
  const counts = rescueSnapshot(run, time);
  const finished = time >= end;
  const unsharedReads = rescueRun(settings, false).filter(
    (r) => r.route === "origin",
  ).length;
  function reset(next = round, nextShared = shared) {
    setPlaying(false);
    setTime(-25);
    setRound(next);
    setShared(nextShared);
  }
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => {
      setReduced(media.matches);
      setPlaying(false);
    };
    const visibility = () => {
      if (document.hidden) setPlaying(false);
    };
    const navigate = () => {
      if (!["#cache-rescue", "#lab"].includes(location.hash)) setPlaying(false);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver((entries) => {
            if (entries.some((entry) => !entry.isIntersecting))
              setPlaying(false);
          });
    if (arena.current) observer?.observe(arena.current);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("hashchange", navigate);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("hashchange", navigate);
    };
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    let frame = 0;
    let previous = performance.now();
    function tick(now: number) {
      const elapsed = now - previous;
      previous = now;
      setTime((t) => Math.min(end, t + (elapsed * (end + 25)) / 3200));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, reduced, end]);
  useEffect(() => {
    if (finished) setPlaying(false);
  }, [finished]);
  return (
    <div className={`cache-game ${playing ? "is-playing" : ""}`}>
      <div className="cache-intro">
        <span className="play-kicker">01 / A SMALL RESCUE MISSION</span>
        <h3 id="rescue-title">
          Beat the rush.
          <br />
          <em>Share the work.</em>
        </h3>
        <p>
          One empty cache. A crowd asking for the same thing. Deliver every
          reply using just one database read.
        </p>
        <div
          className="cache-rounds"
          role="group"
          aria-label="Choose a challenge"
        >
          {ROUNDS.map((r, i) => (
            <button
              key={r.name}
              aria-label={`Challenge ${i + 1}: ${r.name}`}
              aria-pressed={i === round}
              onClick={() => reset(i)}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
        <h4>{settings.name}</h4>
        <p className="cache-mission">{settings.note}</p>
        <div
          className="cache-strategies"
          role="group"
          aria-label="Choose a rescue strategy"
        >
          <button aria-pressed={!shared} onClick={() => reset(round, false)}>
            <span aria-hidden="true">↗ ↗ ↗</span>
            <strong>Everyone fetches</strong>
            <small>Each miss starts a read</small>
          </button>
          <button aria-pressed={shared} onClick={() => reset(round, true)}>
            <span aria-hidden="true">↗ → ↘</span>
            <strong>Share one fetch</strong>
            <small>Wait for one answer</small>
          </button>
        </div>
        <div className="cache-actions">
          <button
            ref={launch}
            className="cache-launch"
            onClick={() => {
              if (reduced) {
                setPlaying(false);
                setTime(end);
              } else if (playing) setPlaying(false);
              else {
                if (finished || time < 0) setTime(0);
                setPlaying(true);
              }
            }}
          >
            {reduced
              ? "Send & see the result"
              : playing
                ? "Pause the rush"
                : finished
                  ? "Play again"
                  : time < 0
                    ? "Send the crowd →"
                    : "Resume the rush"}
          </button>
          <button className="cache-reset" onClick={() => reset()}>
            Reset
          </button>
        </div>
      </div>
      <div className="cache-console" ref={arena}>
        <div className="cache-caption">
          <span>CACHE RESCUE</span>
          <span>
            {time >= settings.originMs ? "CACHE REFILLED" : "CACHE EMPTY"}
          </span>
        </div>
        <div
          className="cache-stage"
          role="img"
          aria-label={`${counts.queries} database ${counts.queries === 1 ? "read" : "reads"}, ${counts.waiting} requests sharing the fetch, ${counts.done} of ${settings.requests} replies delivered.`}
        >
          <div className="cache-station cache-arrivals">
            <span>THE CROWD</span>
            <strong>{settings.requests} requests</strong>
          </div>
          <div className="cache-station cache-database">
            <span>DATABASE</span>
            <strong>
              {counts.queries}
              <small> reads</small>
            </strong>
          </div>
          <div className="cache-station cache-wait">
            <span>SHARING</span>
            <strong>
              {counts.waiting}
              <small> waiting</small>
            </strong>
          </div>
          <div className="cache-station cache-replies">
            <span>DELIVERED</span>
            <strong>
              {counts.done}
              <small> / {settings.requests}</small>
            </strong>
          </div>
          {run.map((request, i) => {
            const state = rescueState(request, time);
            const x =
              state === "querying"
                ? 6 + (i % 6) * 5.8
                : state === "waiting"
                  ? 59 + (i % 6) * 5.8
                  : 22 + (i % 8) * 8;
            const y = state === "pending" ? 67 : state === "done" ? 281 : 177;
            return (
              <span
                key={request.id}
                aria-hidden="true"
                className={`cache-person is-${state}`}
                style={{
                  left: `${x}%`,
                  top:
                    y +
                    Math.floor(
                      i / (state === "waiting" || state === "querying" ? 6 : 8),
                    ) *
                      13,
                }}
              />
            );
          })}
        </div>
        <div className="cache-progress" aria-hidden="true">
          <span
            style={{ width: `${(counts.done / settings.requests) * 100}%` }}
          />
        </div>
        <p
          className="cache-feedback"
          role="status"
          aria-live={playing ? "off" : "polite"}
          aria-atomic="true"
        >
          {finished
            ? counts.queries === 1
              ? `Mission complete. ${counts.done} replies, one database read.${unsharedReads > 1 ? ` Sharing avoided ${unsharedReads - 1} duplicate reads.` : " This time, both strategies need only one read: the cache refills before the next arrival."}`
              : `${counts.done} replies delivered, but ${counts.queries} database reads. Try sharing the first fetch to avoid duplicate work.`
            : time < 0
              ? "Choose a strategy, then send the crowd. Every dot is one request."
              : `${counts.done} of ${settings.requests} replies delivered. ${counts.queries} database ${counts.queries === 1 ? "read" : "reads"} started.`}
        </p>
        {finished && (
          <button
            className="cache-next"
            onClick={() => {
              reset((round + 1) % ROUNDS.length);
              launch.current?.focus({ preventScroll: true });
            }}
          >
            {round === 2 ? "Back to the first challenge" : "Next challenge →"}
          </button>
        )}
        <details className="cache-how">
          <summary>Why does this work?</summary>
          <p>
            Sharing an in-flight fetch lets requests wait for one answer instead
            of repeating the same database read. Once the cache is refilled,
            later arrivals get that answer immediately.
          </p>
          <p>
            A browser model: one key, one coordinator, successful fixed-duration
            fetches, unlimited parallel reads, and instant cache hits. A
            completed refill is available to arrivals at that exact time.
            Playback is slowed for clarity; these are modeled results, not
            production measurements.
          </p>
        </details>
      </div>
    </div>
  );
}
