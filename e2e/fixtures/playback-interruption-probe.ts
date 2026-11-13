import { createElement, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePlaybackInterruption } from "../../src/shared/hooks/usePlaybackInterruption";

const ACTIVE_HASHES = ["#playback-probe"];

function Probe() {
  const target = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [stops, setStops] = useState(0);
  const stop = useCallback(() => {
    setPlaying(false);
    setStops((count) => count + 1);
  }, []);
  usePlaybackInterruption(stop, { target, activeHashes: ACTIVE_HASHES });
  return createElement(
    "div",
    { ref: target, id: "playback-target" },
    createElement("button", { onClick: () => setPlaying(true) }, "Start"),
    createElement(
      "output",
      {
        "data-testid": "playback-state",
        "data-playing": playing,
        "data-stops": stops,
      },
      playing ? "Playing" : "Stopped",
    ),
  );
}

// Actual shared hook, isolated from feature clocks and bundled only by the tests.
createRoot(document.getElementById("playback-probe")!).render(
  createElement(Probe),
);
