import type { ComponentType } from "react";

export type Experience = {
  id: string;
  title: string;
  titleId: string;
  category: string;
  description: string;
  action: string;
  artwork: readonly [string, string, string];
  style: string;
  engineering: {
    decision: string;
    tradeoff: string;
    verification: string;
    source: string;
  };
  entryAliases?: readonly string[];
  load: () => Promise<ComponentType>;
};

/** Stable loaders and entry metadata are shared by navigation and lazy mounting. */
export const experiences: readonly Experience[] = [
  {
    id: "cache-rescue",
    title: "Cache Rescue",
    titleId: "rescue-title",
    category: "STRATEGY",
    description: "Beat the rush. Share the work.",
    action: "Play with requests ↗",
    artwork: ["···", "↘", "●"],
    style: "rescue",
    engineering: {
      decision:
        "I separated request timing from playback: a pure TypeScript model calculates arrivals, shared waits, and cache refills; React renders a snapshot of that model.",
      tradeoff:
        "One key and one coordinator keep the behavior explainable. Fixed successful fetches make strategy comparisons repeatable; the animation is slowed for clarity.",
      verification:
        "refill/arrival ties, shared fetch counts, prediction feedback, keyboard controls, and interruption or reduced-motion behavior.",
      source: "src/features/playground/cache-rescue",
    },
    entryAliases: ["#lab"],
    load: () =>
      import("./cache-rescue/CacheRescue").then((module) => module.CacheRescue),
  },
  {
    id: "connection-game",
    title: "Connection puzzle",
    titleId: "route-title",
    category: "LOGIC",
    description: "A few turns. One bright idea.",
    action: "Find a path ↗",
    artwork: ["┌", "┘", "─"],
    style: "route",
    engineering: {
      decision:
        "Each tile is a four-port bitmask. A pure path tracer follows connected ports, while a feature controller owns moves, hints, Undo, and personal records.",
      tradeoff:
        "Browser-only saves keep play available without an account. Saves are validated and synchronized between tabs; this is local progress, not an online leaderboard.",
      verification:
        "valid tile rotations, complete paths, old-save migration, assisted records, denied storage, and stale tab updates.",
      source: "src/features/playground/connection-puzzle",
    },
    load: () =>
      import("./connection-puzzle/RoutePuzzle").then(
        (module) => module.RoutePuzzle,
      ),
  },
  {
    id: "motion-studio",
    title: "Motion studio",
    titleId: "motion-title",
    category: "FEEL",
    description: "Same journey. Different feeling.",
    action: "Make it move ↗",
    artwork: ["○", "↝", "●"],
    style: "motion",
    engineering: {
      decision:
        "Two Web Animations share a clock and duration. Only the easing curve changes, making its effect directly comparable. The CSS recipe uses the same curve settings.",
      tradeoff:
        "Playback starts on request and stops when the experience leaves view. Reduced motion has a static alternative; clipboard denial leaves a selectable recipe.",
      verification:
        "shared timing, replay, navigation and visibility cancellation, reduced motion, and copy failure recovery.",
      source: "src/features/playground/motion-studio",
    },
    load: () =>
      import("./motion-studio/MotionStudio").then(
        (module) => module.MotionStudio,
      ),
  },
  {
    id: "algorithm-garden",
    title: "Algorithm Garden",
    titleId: "garden-title",
    category: "DISCOVERY",
    description: "Light up a different way to think.",
    action: "Explore the tree ↗",
    artwork: ["●", "⋏", "●"],
    style: "garden",
    engineering: {
      decision:
        "One pure traversal model produces the play order, hints, and visible queue or stack. React adds input and feedback without a second copy of the algorithm.",
      tradeoff:
        "Three authored trees keep layouts readable on small screens and make comparisons repeatable. Mistakes explain the rule and let the visitor continue.",
      verification:
        "each node visited once, parent precedence, queue/stack order, tree selection, and complete keyboard journeys.",
      source: "src/features/playground/algorithm-garden",
    },
    load: () =>
      import("./algorithm-garden/AlgorithmGarden").then(
        (module) => module.AlgorithmGarden,
      ),
  },
];
