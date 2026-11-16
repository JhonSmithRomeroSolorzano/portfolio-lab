import { createElement, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useRouteProgress } from "../../src/features/playground/connection-puzzle/useRouteProgress";

export type RouteProbeState = Pick<
  ReturnType<typeof useRouteProgress>,
  "progress" | "status" | "notice" | "hint" | "canUndo"
>;
export type RouteProbeWindow = typeof window & {
  routeProgressProbe: {
    turn(index: number): void;
    select(level: number): void;
    hint(): void;
    undo(): boolean;
    reset(): void;
    rerender(): void;
    unmount(): void;
    mount(): void;
  };
};

let controls: ReturnType<typeof useRouteProgress>;
let rerender: () => void;
function Probe() {
  const current = useRouteProgress();
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    controls = current;
    rerender = () => setTick((value) => value + 1);
  });
  const { progress, status, notice, hint, canUndo } = current;
  const state: RouteProbeState = { progress, status, notice, hint, canUndo };
  return createElement(
    "output",
    {
      "data-testid": "route-state",
      "data-tick": tick,
    },
    JSON.stringify(state),
  );
}

const host = document.getElementById("route-probe")!;
let root = createRoot(host);
Object.assign(window, {
  routeProgressProbe: {
    turn: (index: number) => controls.turn(index),
    select: (level: number) => controls.select(level),
    hint: () => controls.giveHint(),
    undo: () => controls.undo(),
    reset: () => controls.reset(),
    rerender: () => rerender(),
    unmount: () => root.unmount(),
    mount: () => {
      root = createRoot(host);
      root.render(createElement(Probe));
    },
  },
});
root.render(createElement(Probe));
