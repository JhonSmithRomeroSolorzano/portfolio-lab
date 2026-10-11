import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import {
  REDUCED_MOTION,
  usePlaybackInterruption,
} from "../../../shared/hooks/usePlaybackInterruption";
import { CURVES } from "./curves";

export function useMotionPlayback() {
  const [curve, setCurve] = useState(1);
  const [duration, setDuration] = useState(1100);
  const [playing, setPlaying] = useState(false);
  const [arrived, setArrived] = useState(false);
  const reduced = useMediaQuery(REDUCED_MOTION);
  const runner = useRef<HTMLDivElement>(null);
  const baseline = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const cancel = useCallback(() => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    setPlaying(false);
  }, []);
  const interrupt = useCallback(() => {
    cancel();
    setArrived(false);
  }, [cancel]);
  usePlaybackInterruption(interrupt);
  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );
  function chooseCurve(next: number) {
    interrupt();
    setCurve(next);
  }
  function chooseDuration(next: number) {
    interrupt();
    setDuration(next);
  }
  function play() {
    cancel();
    setArrived(false);
    const nodes = [runner.current, baseline.current];
    if (reduced || nodes.some((node) => !node?.animate)) {
      setArrived(true);
      return;
    }
    const current = nodes.map((node, index) =>
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
    );
    // Both lanes share the same document clock, distance, and duration.
    const start = document.timeline.currentTime;
    if (typeof start === "number")
      current.forEach((animation) => {
        animation.startTime = start;
      });
    animations.current = current;
    setPlaying(true);
    Promise.all(current.map((animation) => animation.finished)).then(
      () => {
        if (animations.current === current) {
          setArrived(true);
          setPlaying(false);
          current.forEach((animation) => animation.cancel());
          animations.current = [];
        }
      },
      () => {},
    );
  }

  return {
    curve,
    duration,
    playing,
    arrived,
    reduced,
    runner,
    baseline,
    chooseCurve,
    chooseDuration,
    play,
  };
}
