import { useRef } from "react";
import { CacheArena } from "./CacheArena";
import { ROUNDS } from "./rounds";
import { useCacheRescue } from "./useCacheRescue";

export function CacheRescue() {
  const {
    round,
    shared,
    time,
    playing,
    reduced,
    arena,
    settings,
    run,
    counts,
    finished,
    unsharedReads,
    reset,
    togglePlayback,
  } = useCacheRescue();
  const launch = useRef<HTMLButtonElement>(null);

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
            onClick={togglePlayback}
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
        <CacheArena run={run} time={time} settings={settings} counts={counts} />
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
