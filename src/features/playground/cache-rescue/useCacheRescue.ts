import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  rescueRun,
  rescueSnapshot,
} from "../../../domain/playground/cache-rescue";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import {
  REDUCED_MOTION,
  usePlaybackInterruption,
} from "../../../shared/hooks/usePlaybackInterruption";
import { ROUNDS } from "./rounds";

const ACTIVE_HASHES = ["#cache-rescue", "#lab"];

export function useCacheRescue() {
  const [round, setRound] = useState(0);
  const [shared, setShared] = useState(false);
  const [time, setTime] = useState(-25);
  const [playRequested, setPlaying] = useState(false);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const arena = useRef<HTMLDivElement>(null);
  const settings = ROUNDS[round];
  const run = useMemo(() => rescueRun(settings, shared), [settings, shared]);
  const end = Math.max(...run.map((r) => r.completed));
  const counts = rescueSnapshot(run, time);
  const finished = time >= end;
  const playing = playRequested && !finished;
  const unsharedReads = rescueRun(settings, false).filter(
    (r) => r.route === "origin",
  ).length;
  function reset(next = round, nextShared = shared) {
    setPlaying(false);
    setTime(-25);
    setRound(next);
    setShared(nextShared);
  }
  const pause = useCallback(() => setPlaying(false), []);
  usePlaybackInterruption(pause, {
    target: arena,
    activeHashes: ACTIVE_HASHES,
  });
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
  function togglePlayback() {
    if (reduced) {
      setPlaying(false);
      setTime(end);
    } else if (playing) setPlaying(false);
    else {
      if (finished || time < 0) setTime(0);
      setPlaying(true);
    }
  }
  return {
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
  };
}
