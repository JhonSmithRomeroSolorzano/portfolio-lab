import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EAST,
  WEST,
  NORTH,
  SOUTH,
  PUZZLES,
  rotateTile,
  routeHint,
  solvedBoard,
  startingBoard,
  traceRoute,
} from "../src/domain/playground/route-puzzle";

test("every puzzle starts disconnected and can be solved by rotating its tiles", () => {
  PUZZLES.forEach((puzzle, level) => {
    const start = startingBoard(level),
      solved = solvedBoard(level);
    assert.equal(traceRoute(start).won, false);
    assert.deepEqual(traceRoute(solved), {
      cells: [...puzzle.path],
      won: true,
    });
    start.forEach((tile, i) => {
      const rotations = [tile];
      for (let n = 0; n < 3; n++) rotations.push(rotateTile(rotations.at(-1)!));
      assert.ok(rotations.includes(solved[i]));
      assert.equal(rotateTile(rotations.at(-1)!), tile);
    });
    assert.deepEqual(startingBoard(level), start);
  });
});

test("signal requires reciprocal ports and cannot wrap around a row", () => {
  const board = Array(16).fill(EAST | WEST);
  assert.deepEqual(traceRoute(board), { cells: [0, 1, 2, 3], won: false });
  board[1] = NORTH | SOUTH;
  assert.deepEqual(traceRoute(board), { cells: [0], won: false });
  board[0] = EAST | SOUTH;
  assert.deepEqual(traceRoute(board), { cells: [], won: false });
});

test("the destination must have an outlet, and broken routes stop at the last connected tile", () => {
  const board = solvedBoard(0);
  board[15] = NORTH | WEST;
  assert.equal(traceRoute(board).won, false);
  board[5] = NORTH | EAST;
  assert.deepEqual(traceRoute(board), { cells: [0, 1, 5], won: false });
});

test("hints never mutate the board and lead to a connection for every puzzle", () => {
  PUZZLES.forEach((_, level) => {
    const board = startingBoard(level);
    for (let step = 0; step < 16 && !traceRoute(board).won; step++) {
      const before = [...board];
      const hint = routeHint(board, level);
      assert.deepEqual(board, before);
      assert.deepEqual(routeHint(board, level), hint);
      assert.ok(hint);
      for (
        let turns = 0;
        board[hint.index] !== hint.ports && turns < 4;
        turns++
      ) {
        board[hint.index] = rotateTile(board[hint.index]);
      }
      assert.equal(board[hint.index], hint.ports);
    }
    assert.ok(traceRoute(board).won);
    assert.equal(routeHint(board, level), null);
  });
});

test("a valid alternate route needs no hint, even when it differs from the authored solution", () => {
  const board = solvedBoard(0);
  // Shorter route: 0 → 1 → 5 → 9 → 10 → 11 → 15.
  board[5] = NORTH | SOUTH;
  board[9] = NORTH | EAST;
  board[10] = WEST | EAST;
  board[11] = WEST | SOUTH;
  assert.ok(traceRoute(board).won);
  assert.equal(routeHint(board, 0), null);
});
