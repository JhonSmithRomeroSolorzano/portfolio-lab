import { createElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DeferredExperiment } from "../../src/features/playground/DeferredExperiment";

export type DeferredProbeWindow = typeof window & {
  deferredProbe: {
    resolve(): void;
    reject(): void;
    crash(phase: "render" | "effect"): void;
    unmount(): void;
    metrics(): { requests: number; mounts: number; disposals: number };
  };
};

let requests = 0,
  mounts = 0,
  disposals = 0;
let phase: "render" | "effect" = "render";
let trigger: (() => void) | undefined;
function ResourceLab() {
  const [broken, setBroken] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  trigger = () => setBroken(true);
  useEffect(() => {
    mounts++;
    const listener = () => {};
    window.addEventListener("fixture-resource", listener);
    const intersection = new IntersectionObserver(() => {});
    const resize = new ResizeObserver(() => {});
    intersection.observe(target.current!);
    resize.observe(target.current!);
    const interval = window.setInterval(() => {}, 1000);
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposals++;
      window.removeEventListener("fixture-resource", listener);
      intersection.disconnect();
      resize.disconnect();
      clearInterval(interval);
      cancelAnimationFrame(frame);
      trigger = undefined;
    };
  }, []);
  useEffect(() => {
    if (broken && phase === "effect") throw new Error("Fixture effect failure");
  }, [broken]);
  if (broken && phase === "render") throw new Error("Fixture render failure");
  return createElement(
    "div",
    { ref: target, "data-testid": "loaded-lab" },
    "Loaded lab",
  );
}

let resolve!: (component: typeof ResourceLab) => void;
let reject!: (reason: Error) => void;
const pending = new Promise<typeof ResourceLab>((accept, refuse) => {
  resolve = accept;
  reject = refuse;
});
const load = () => {
  requests++;
  return pending;
};
const root = createRoot(document.getElementById("probe-root")!);
document.getElementById("fixture-lab")!.focus({ preventScroll: true });
root.render(
  createElement(DeferredExperiment, {
    id: "fixture-lab",
    title: "Fixture lab",
    titleId: "fixture-title",
    load,
  }),
);
Object.assign(window, {
  deferredProbe: {
    resolve: () => resolve(ResourceLab),
    reject: () => reject(new Error("Fixture import failure")),
    crash: (next: "render" | "effect") => {
      phase = next;
      trigger?.();
    },
    unmount: () => root.unmount(),
    metrics: () => ({ requests, mounts, disposals }),
  },
});
