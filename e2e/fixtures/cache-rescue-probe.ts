import { createElement, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useCacheRescue } from "../../src/features/playground/cache-rescue/useCacheRescue";

export type CacheProbeState = Pick<
  ReturnType<typeof useCacheRescue>,
  | "round"
  | "shared"
  | "time"
  | "playing"
  | "finished"
  | "reduced"
  | "unsharedReads"
  | "counts"
  | "run"
  | "prediction"
>;
export type RunCall = {
  requests: number;
  originMs: number;
  spacingMs: number;
  coalesce: boolean;
};
export type CacheProbeWindow = typeof window & {
  cacheRescueRunCalls: RunCall[];
  cacheRescueProbe: {
    guess(value: string): void;
    round(index: number): void;
    strategy(shared: boolean): void;
    reset(): void;
    play(): boolean;
    rerender(): void;
  };
};

let controls: ReturnType<typeof useCacheRescue>;
let rerender: () => void;
function Probe() {
  const current = useCacheRescue();
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    controls = current;
    rerender = () => setTick((value) => value + 1);
  });
  const {
    round,
    shared,
    time,
    playing,
    finished,
    reduced,
    unsharedReads,
    counts,
    run,
    prediction,
  } = current;
  const state: CacheProbeState = {
    round,
    shared,
    time,
    playing,
    finished,
    reduced,
    unsharedReads,
    counts,
    run,
    prediction,
  };
  return createElement(
    "div",
    { ref: current.arena },
    createElement(
      "output",
      {
        "data-testid": "cache-state",
        "data-tick": tick,
      },
      JSON.stringify(state),
    ),
  );
}

// Test-only host, bundled in memory without changing the portfolio build.
Object.assign(window, {
  cacheRescueRunCalls: [],
  cacheRescueProbe: {
    guess: (value: string) => controls.guess(value),
    round: (index: number) => controls.chooseRound(index),
    strategy: (shared: boolean) => controls.chooseStrategy(shared),
    reset: () => controls.reset(),
    play: () => controls.togglePlayback(),
    rerender: () => rerender(),
  },
});
createRoot(document.getElementById("cache-probe")!).render(
  createElement(Probe),
);
