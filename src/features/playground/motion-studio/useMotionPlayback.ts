import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../shared/hooks/useReducedMotion";
import { usePlaybackInterruption } from "../../../shared/hooks/usePlaybackInterruption";
import { CURVES, MOTION_DURATION } from "./curves";

const ACTIVE_HASHES = ["#motion-studio", "#lab"];

export function useMotionPlayback() {
  const [curve, setCurve] = useState(1);
  const [duration, setDuration] = useState<number>(MOTION_DURATION.initial);
  const [playing, setPlaying] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const runner = useRef<HTMLDivElement>(null);
  const baseline = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const cancel = useCallback(() => {
    const current = animations.current;
    animations.current = [];
    current.forEach((animation) => animation.cancel());
    setPlaying(false);
  }, []);
  const interrupt = useCallback(() => {
    cancel();
    setArrived(false);
    setUnavailable(false);
  }, [cancel]);
  usePlaybackInterruption(interrupt, {
    target: container,
    activeHashes: ACTIVE_HASHES,
  });
  useEffect(
    () => () => {
      const current = animations.current;
      animations.current = [];
      current.forEach((animation) => animation.cancel());
    },
    [],
  );
  function chooseCurve(next: number) {
    if (!Number.isInteger(next) || next < 0 || next >= CURVES.length) return;
    if (next === curve) return;
    interrupt();
    setCurve(next);
  }
  function chooseDuration(next: number) {
    if (
      !Number.isInteger(next) ||
      next < MOTION_DURATION.min ||
      next > MOTION_DURATION.max ||
      (next - MOTION_DURATION.min) % MOTION_DURATION.step !== 0
    )
      return;
    if (next === duration) return;
    interrupt();
    setDuration(next);
  }
  function play() {
    cancel();
    setArrived(false);
    setUnavailable(false);
    const nodes = [runner.current, baseline.current];
    if (reduced || nodes.some((node) => !node?.animate)) {
      setUnavailable(!reduced);
      setArrived(true);
      return;
    }
    const current: Animation[] = [];
    animations.current = current;
    const settle = (failed: boolean) => {
      if (animations.current !== current) return;
      cancel();
      setUnavailable(failed);
      setArrived(true);
    };
    try {
      nodes.forEach((node, index) =>
        current.push(
          node!.animate(
            [
              { left: "0%", transform: "rotate(0deg)" },
              { left: "calc(100% - 44px)", transform: "rotate(180deg)" },
            ],
            {
              duration,
              easing: index === 0 ? CURVES[curve].easing : "linear",
              fill: "forwards",
            },
          ),
        ),
      );
      // Both lanes share the same document clock, distance, and duration.
      const start = document.timeline.currentTime;
      if (typeof start === "number")
        current.forEach((animation) => {
          animation.startTime = start;
        });
    } catch {
      // A later lane can fail after the first animation was created. Observe
      // its cancellation rejection before releasing every partial resource.
      current.forEach((animation) => void animation.finished.catch(() => {}));
      settle(true);
      return;
    }
    setPlaying(true);
    Promise.all(current.map((animation) => animation.finished)).then(
      () => settle(false),
      () => settle(true),
    );
  }

  return {
    curve,
    duration,
    playing,
    arrived,
    unavailable,
    reduced,
    container,
    runner,
    baseline,
    chooseCurve,
    chooseDuration,
    play,
  };
}
