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
    load: () =>
      import("./algorithm-garden/AlgorithmGarden").then(
        (module) => module.AlgorithmGarden,
      ),
  },
];
