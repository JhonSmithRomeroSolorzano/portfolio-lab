export type Walk = "breadth" | "depth";
export type GardenNode = Readonly<{
  id: string;
  parent: string | null;
  x: number;
  y: number;
}>;
export const GARDENS: readonly {
  name: string;
  nodes: readonly GardenNode[];
}[] = [
  {
    name: "Balanced branches",
    nodes: [
      { id: "A", parent: null, x: 50, y: 14 },
      { id: "B", parent: "A", x: 25, y: 45 },
      { id: "C", parent: "A", x: 75, y: 45 },
      { id: "D", parent: "B", x: 12.5, y: 78 },
      { id: "E", parent: "B", x: 37.5, y: 78 },
      { id: "F", parent: "C", x: 62.5, y: 78 },
      { id: "G", parent: "C", x: 87.5, y: 78 },
    ],
  },
  {
    name: "Deep roots",
    nodes: [
      { id: "A", parent: null, x: 50, y: 10 },
      { id: "B", parent: "A", x: 35, y: 34 },
      { id: "C", parent: "A", x: 80, y: 34 },
      { id: "D", parent: "B", x: 24, y: 58 },
      { id: "E", parent: "B", x: 57, y: 58 },
      { id: "F", parent: "D", x: 12.5, y: 84 },
      { id: "G", parent: "D", x: 37.5, y: 84 },
    ],
  },
  {
    name: "Open canopy",
    nodes: [
      { id: "A", parent: null, x: 50, y: 14 },
      { id: "B", parent: "A", x: 22, y: 45 },
      { id: "C", parent: "A", x: 75, y: 45 },
      { id: "D", parent: "B", x: 22, y: 78 },
      { id: "E", parent: "C", x: 60, y: 78 },
      { id: "F", parent: "C", x: 87.5, y: 78 },
    ],
  },
];
export const TREE = GARDENS[0].nodes;

/** Left-to-right breadth-first or pre-order depth-first traversal of an authored tree. */
export function gardenOrder(
  mode: Walk,
  tree: readonly GardenNode[] = TREE,
): string[] {
  const pending: string[] = [tree[0].id];
  const visited: string[] = [];
  while (pending.length) {
    const next = pending.shift()!;
    visited.push(next);
    const children = tree
      .filter((node) => node.parent === next)
      .map((node) => node.id);
    if (mode === "breadth") pending.push(...children);
    else pending.unshift(...children);
  }
  return visited;
}
