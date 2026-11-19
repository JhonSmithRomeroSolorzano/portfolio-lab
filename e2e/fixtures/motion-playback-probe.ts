import { createElement, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useMotionPlayback } from "../../src/features/playground/motion-studio/useMotionPlayback";

export type MotionProbeState = Pick<
  ReturnType<typeof useMotionPlayback>,
  "curve" | "duration" | "playing" | "arrived" | "reduced"
>;
export type MotionProbeWindow = typeof window & {
  motionPlaybackProbe: {
    curve(value: number): void;
    duration(value: number): void;
    play(): Promise<void>;
    finish(): void;
    rerender(): void;
    unmount(): void;
    animations(): {
      created: number;
      handles: Array<{
        id: number;
        playState: AnimationPlayState;
        pending: boolean;
        currentTime: number | null;
        duration: number | string;
        easing: string;
      }>;
    };
  };
};

let controls: ReturnType<typeof useMotionPlayback>;
let rerender: () => void;
let sequence = 0;
let handles: Array<{ id: number; animation: Animation }> = [];
function Probe() {
  const current = useMotionPlayback();
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    controls = current;
    rerender = () => setTick((value) => value + 1);
  });
  const { curve, duration, playing, arrived, reduced } = current;
  const state: MotionProbeState = {
    curve,
    duration,
    playing,
    arrived,
    reduced,
  };
  const style = { position: "relative", width: 44, height: 44 } as const;
  return createElement(
    "div",
    { ref: current.container },
    createElement("div", { ref: current.runner, style }),
    createElement("div", { ref: current.baseline, style }),
    createElement(
      "output",
      { "data-testid": "motion-state", "data-tick": tick },
      JSON.stringify(state),
    ),
  );
}
const root = createRoot(document.getElementById("motion-probe")!);
Object.assign(window, {
  motionPlaybackProbe: {
    curve: (value: number) => controls.chooseCurve(value),
    duration: (value: number) => controls.chooseDuration(value),
    async play() {
      controls.play();
      handles = [controls.runner.current!, controls.baseline.current!]
        .flatMap((node) => node.getAnimations())
        .map((animation) => ({ id: ++sequence, animation }));
      // Hold real native animations; keep their genuine ready/finished/cancel
      // behavior without racing the controller's short wall-clock duration.
      handles.forEach(({ animation }) => animation.pause());
      await Promise.all(handles.map(({ animation }) => animation.ready));
    },
    finish: () => handles.forEach(({ animation }) => animation.finish()),
    rerender: () => rerender(),
    unmount: () => root.unmount(),
    animations: () => ({
      created: sequence,
      handles: handles.map(({ id, animation }) => ({
        id,
        playState: animation.playState,
        pending: animation.pending,
        currentTime:
          animation.currentTime === null ? null : Number(animation.currentTime),
        duration: animation.effect!.getTiming().duration,
        easing: animation.effect!.getTiming().easing,
      })),
    }),
  },
});
root.render(createElement(Probe));
