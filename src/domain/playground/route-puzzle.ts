export const NORTH = 1,
  EAST = 2,
  SOUTH = 4,
  WEST = 8;
export const SIZE = 4;
export const PUZZLES = [
  { name: "First connection", path: [0, 1, 5, 4, 8, 9, 10, 6, 7, 11, 15] },
  {
    name: "The scenic route",
    path: [0, 4, 8, 12, 13, 9, 5, 1, 2, 6, 10, 14, 15],
  },
  { name: "Switchback", path: [0, 1, 2, 3, 7, 6, 5, 9, 10, 11, 15] },
] as const;

export function rotateTile(tile: number) {
  return ((tile << 1) & 15) | (tile >> 3);
}
function direction(from: number, to: number) {
  return to === from + 1
    ? EAST
    : to === from - 1
      ? WEST
      : to > from
        ? SOUTH
        : NORTH;
}
export function solvedBoard(level: number): number[] {
  const path: readonly number[] = PUZZLES[level].path;
  const board = Array.from({ length: SIZE * SIZE }, (_, i) =>
    i % 2 ? EAST | WEST : NORTH | EAST,
  );
  path.forEach((cell, i) => {
    board[cell] =
      (i === 0 ? WEST : direction(cell, path[i - 1])) |
      (i === path.length - 1 ? EAST : direction(cell, path[i + 1]));
  });
  return board;
}
export function startingBoard(level: number) {
  return solvedBoard(level).map((tile, i) => {
    for (let turns = 0; turns < ((i + level) % 3) + 1; turns++)
      tile = rotateTile(tile);
    return tile;
  });
}
export function traceRoute(board: readonly number[]) {
  const cells: number[] = [];
  let cell = 0,
    incoming = WEST;
  while (cell >= 0 && cell < SIZE * SIZE && !cells.includes(cell)) {
    const tile = board[cell];
    if (!(tile & incoming)) return { cells, won: false };
    cells.push(cell);
    const outgoing = tile ^ incoming;
    if (cell === 15 && outgoing === EAST) return { cells, won: true };
    if (outgoing === EAST && cell % SIZE < SIZE - 1) {
      cell++;
      incoming = WEST;
    } else if (outgoing === WEST && cell % SIZE > 0) {
      cell--;
      incoming = EAST;
    } else if (outgoing === SOUTH && cell < SIZE * (SIZE - 1)) {
      cell += SIZE;
      incoming = NORTH;
    } else if (outgoing === NORTH && cell >= SIZE) {
      cell -= SIZE;
      incoming = SOUTH;
    } else break;
  }
  return { cells, won: false };
}
export function portNames(tile: number) {
  return [
    [NORTH, "up"],
    [EAST, "right"],
    [SOUTH, "down"],
    [WEST, "left"],
  ]
    .filter(([port]) => tile & Number(port))
    .map(([, name]) => name)
    .join(" and ");
}

// Offer one step along an authored solution; other valid routes are welcome.
export function routeHint(board: readonly number[], level: number) {
  if (traceRoute(board).won) return null;
  const solution = solvedBoard(level);
  const index = PUZZLES[level].path.find(
    (cell) => board[cell] !== solution[cell],
  );
  return index === undefined ? null : { index, ports: solution[index] };
}
