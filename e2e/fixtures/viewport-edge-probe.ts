import { createElement, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useStackFlow } from "../../src/features/portfolio/useStackFlow";
import { usePlaybackInterruption } from "../../src/shared/hooks/usePlaybackInterruption";
import { useViewportPlayback } from "../../src/shared/hooks/useViewportPlayback";

function Autoplay() {
  const target = useRef<HTMLDivElement>(null);
  const playback = useViewportPlayback(target, true);
  return createElement("div", {
    id: "drawing",
    ref: target,
    "data-playing": playback.playing,
  });
}

function StackFlow() {
  const flow = useStackFlow();
  return createElement("div", {
    id: "drawing",
    ref: flow.target,
    "data-playing": flow.playing,
  });
}

function ExplicitPlayback() {
  const target = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const stop = useCallback(() => setPlaying(false), []);
  usePlaybackInterruption(stop, { target });
  return createElement(
    "div",
    null,
    createElement("button", { onClick: () => setPlaying(true) }, "Play"),
    createElement("div", {
      id: "drawing",
      ref: target,
      "data-playing": playing,
    }),
  );
}

const kind = new URLSearchParams(location.search).get("kind");
createRoot(document.getElementById("probe")!).render(
  createElement(
    kind === "autoplay"
      ? Autoplay
      : kind === "stack"
        ? StackFlow
        : ExplicitPlayback,
  ),
);
