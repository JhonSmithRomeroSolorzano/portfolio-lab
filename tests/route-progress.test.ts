import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshProgress,
  parseProgress,
  loadProgress,
  saveProgress,
} from "../src/play/route-progress";
import { rotateTile, traceRoute } from "../src/play/route-puzzle";

test("progress restores distinct boards, turns, and selection without storing derived results", () => {
  const progress = freshProgress();
  progress.level = 2;
  progress.boards[0].tiles[0] = rotateTile(progress.boards[0].tiles[0]);
  progress.boards[0].moves = 1;
  progress.boards[2].tiles[4] = rotateTile(progress.boards[2].tiles[4]);
  progress.boards[2].moves = 3;
  let value: string | null = null;
  const storage = () => ({
    getItem: () => value,
    setItem: (_key: string, raw: string) => {
      value = raw;
    },
  });
  assert.equal(loadProgress(storage).status, "new");
  assert.equal(saveProgress(progress, storage), true);
  assert.deepEqual(loadProgress(storage), { progress, status: "saved" });
  const withFakeWin = parseProgress(JSON.stringify({ ...progress, won: true }));
  assert.ok(withFakeWin);
  assert.equal(traceRoute(withFakeWin.boards[2].tiles).won, false);
});

test("corrupt, excessive, incompatible, and impossible saves are rejected atomically", () => {
  for (const raw of ["null", "{", "[]", " ".repeat(4097)])
    assert.equal(parseProgress(raw), null);
  const invalid = [
    { ...freshProgress(), version: 2 },
    { ...freshProgress(), level: -1 },
    { ...freshProgress(), level: 3 },
    { ...freshProgress(), level: 0.5 },
    { ...freshProgress(), boards: [] },
  ];
  for (const data of invalid)
    assert.equal(parseProgress(JSON.stringify(data)), null);
  for (const value of [-1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) {
    const data = freshProgress();
    Object.assign(data.boards[1], { moves: value });
    assert.equal(parseProgress(JSON.stringify(data)), null);
  }
  for (const value of [0, 15, 3, "5", null, 5.5]) {
    const data = freshProgress();
    Object.assign(data.boards[0].tiles, { 0: value }); // Tile zero must remain a straight.
    assert.equal(parseProgress(JSON.stringify(data)), null);
  }
  const short = freshProgress();
  short.boards[2].tiles.pop();
  assert.equal(parseProgress(JSON.stringify(short)), null);
});

test("loading does not overwrite an unreadable save and denied storage keeps a playable board", () => {
  let writes = 0;
  const corrupt = () => ({
    getItem: () => "{bad",
    setItem: () => {
      writes++;
    },
  });
  assert.deepEqual(loadProgress(corrupt), {
    progress: freshProgress(),
    status: "invalid",
  });
  assert.equal(writes, 0);
  const denied = () => {
    throw new Error("denied");
  };
  assert.deepEqual(loadProgress(denied), {
    progress: freshProgress(),
    status: "unavailable",
  });
  assert.equal(saveProgress(freshProgress(), denied), false);
  const quota = () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  });
  assert.equal(saveProgress(freshProgress(), quota), false);
});
