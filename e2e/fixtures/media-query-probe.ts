import { createElement, StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { useMediaQuery } from "../../src/shared/hooks/useMediaQuery";

export type MediaProbeWindow = Window & {
  mediaQueryProbe: { render(query: string): number; unmount(): void };
};

function Probe({ query, tick }: { query: string; tick: number }) {
  const matches = useMediaQuery(query);
  return createElement(
    "output",
    {
      "data-testid": "media-match",
      "data-query": query,
      "data-tick": tick,
    },
    String(matches),
  );
}

// Built in memory by this test only; never imported by the portfolio entry.
const container = document.getElementById("media-probe")!;
let query = container.dataset.query!;
let tick = 0;
const view = () =>
  createElement(StrictMode, null, createElement(Probe, { query, tick }));
const hydrating = container.dataset.hydrate === "true";
const root = hydrating ? hydrateRoot(container, view()) : createRoot(container);
if (!hydrating) root.render(view());
Object.defineProperty(window, "mediaQueryProbe", {
  value: {
    render(next: string) {
      query = next;
      tick++;
      root.render(view());
      return tick;
    },
    unmount() {
      root.unmount();
    },
  },
});
