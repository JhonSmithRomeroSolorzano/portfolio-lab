export type Walk = "breadth" | "depth";
export const TREE = [
  { id: "A", parent: null, x: 50, y: 14 },
  { id: "B", parent: "A", x: 25, y: 45 },
  { id: "C", parent: "A", x: 75, y: 45 },
  { id: "D", parent: "B", x: 12.5, y: 78 },
  { id: "E", parent: "B", x: 37.5, y: 78 },
  { id: "F", parent: "C", x: 62.5, y: 78 },
  { id: "G", parent: "C", x: 87.5, y: 78 },
] as const;

/** Left-to-right breadth-first or pre-order depth-first traversal. */
export function gardenOrder(mode: Walk): string[] {
  const pending: string[] = [TREE[0].id];
  const visited: string[] = [];
  while (pending.length) {
    const next = pending.shift()!;
    visited.push(next);
    const children = TREE.filter((node) => node.parent === next).map(
      (node) => node.id,
    );
    if (mode === "breadth") pending.push(...children);
    else pending.unshift(...children);
  }
  return visited;
}
