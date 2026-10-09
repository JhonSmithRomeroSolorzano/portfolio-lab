import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EAST,
  WEST,
  NORTH,
  SOUTH,
  PUZZLES,
  rotateTile,
  solvedBoard,
  startingBoard,
  traceRoute,
} from "../src/play/route-puzzle";

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
