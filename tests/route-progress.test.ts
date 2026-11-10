import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshProgress,
  parseProgress,
  loadProgress,
  saveProgress,
  ROUTE_PROGRESS_KEY,
} from "../src/features/playground/connection-puzzle/route-progress";
import {
  createRouteVisit,
  routeTransition,
} from "../src/features/playground/connection-puzzle/route-transitions";
import { rotateTile, traceRoute } from "../src/domain/playground/route-puzzle";

test("progress restores distinct boards, turns, and selection without storing derived results", () => {
  const initial = freshProgress();
  const progress = {
    ...initial,
    level: 2,
    boards: initial.boards.map((board, level) =>
      level === 1
        ? board
        : {
            ...board,
            tiles: board.tiles.map((tile, index) =>
              index === (level === 0 ? 0 : 4) ? rotateTile(tile) : tile,
            ),
            moves: level === 0 ? 1 : 3,
            rotations: level === 0 ? 1 : 3,
          },
    ),
  };
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
    { ...freshProgress(), version: 3 },
    { ...freshProgress(), level: -1 },
    { ...freshProgress(), level: 3 },
    { ...freshProgress(), level: 0.5 },
    { ...freshProgress(), boards: [] },
  ];
  for (const data of invalid)
    assert.equal(parseProgress(JSON.stringify(data)), null);
  for (const value of [-1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) {
    const progress = freshProgress();
    const data = {
      ...progress,
      boards: progress.boards.map((board, i) =>
        i === 1 ? { ...board, moves: value } : board,
      ),
    };
    assert.equal(parseProgress(JSON.stringify(data)), null);
  }
  for (const value of [0, 15, 3, "5", null, 5.5]) {
    const progress = freshProgress();
    const data = {
      ...progress,
      boards: progress.boards.map((board, i) =>
        // Tile zero must remain a straight.
        i === 0 ? { ...board, tiles: [value, ...board.tiles.slice(1)] } : board,
      ),
    };
    assert.equal(parseProgress(JSON.stringify(data)), null);
  }
  const progress = freshProgress();
  const short = {
    ...progress,
    boards: progress.boards.map((board, i) =>
      i === 2 ? { ...board, tiles: board.tiles.slice(0, -1) } : board,
    ),
  };
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

test("legacy progress preserves boards without inventing personal records", () => {
  const legacy = {
    version: 1,
    level: 1,
    boards: freshProgress().boards.map(({ tiles, moves }) => ({
      tiles,
      moves,
    })),
  };
  const migrated = parseProgress(JSON.stringify(legacy))!;
  assert.equal(migrated.version, 2);
  assert.equal(migrated.level, 1);
  assert.equal(migrated.boards[0].rotations, null);
  assert.deepEqual(migrated.records, freshProgress().records);
});
test("records and attempt history reject invalid storage values", () => {
  for (const value of [-1, 0, 1.5, "3", false]) {
    const progress = freshProgress();
    const data = {
      ...progress,
      records: progress.records.map((record, i) =>
        i === 0 ? { ...record, unassisted: value } : record,
      ),
    };
    assert.equal(parseProgress(JSON.stringify(data)), null);
  }
  const progress = freshProgress();
  const data = {
    ...progress,
    boards: progress.boards.map((board, i) =>
      i === 0 ? { ...board, moves: 3, rotations: 2 } : board,
    ),
  };
  assert.equal(parseProgress(JSON.stringify(data)), null);
});

test("malformed nested saves are rejected without modifying stored bytes", () => {
  const fresh = freshProgress();
  const malformed = [
    { ...fresh, version: "2" },
    { ...fresh, version: 99 },
    { ...fresh, records: null },
    { ...fresh, records: [null, ...fresh.records.slice(1)] },
    { ...fresh, records: [{ assisted: null }, ...fresh.records.slice(1)] },
    {
      ...fresh,
      records: [{ unassisted: 0, assisted: null }, ...fresh.records.slice(1)],
    },
    { ...fresh, boards: [null, ...fresh.boards.slice(1)] },
    ...[
      { assisted: "false" },
      { assisted: undefined },
      { rotations: undefined },
      { rotations: -1 },
      { rotations: 0.5 },
      { rotations: Number.MAX_SAFE_INTEGER + 1 },
      { tiles: null },
      { tiles: [...fresh.boards[0].tiles, 5] },
    ].map((patch) => ({
      ...fresh,
      boards: [{ ...fresh.boards[0], ...patch }, ...fresh.boards.slice(1)],
    })),
  ];
  for (const value of malformed) {
    const raw = JSON.stringify(value);
    let stored = raw;
    let writes = 0;
    const storage = () => ({
      getItem: (key: string) => {
        assert.equal(key, ROUTE_PROGRESS_KEY);
        return stored;
      },
      setItem: (_key: string, next: string) => {
        writes++;
        stored = next;
      },
    });
    assert.deepEqual(loadProgress(storage), {
      progress: fresh,
      status: "invalid",
    });
    assert.equal(stored, raw);
    assert.equal(writes, 0);
  }
});

test("read denial and quota failures preserve the old save until an explicit successful retry", () => {
  const initial = freshProgress();
  const next = routeTransition(
    createRouteVisit({ progress: initial, status: "saved" }),
    { type: "turn", index: 0 },
  )!;
  let raw = JSON.stringify(initial);
  let denyRead = true;
  let denyWrite = true;
  const storage = () => ({
    getItem: () => {
      if (denyRead) throw new DOMException("Denied", "SecurityError");
      return raw;
    },
    setItem: (_key: string, value: string) => {
      if (denyWrite) throw new DOMException("Full", "QuotaExceededError");
      raw = value;
    },
  });
  assert.equal(loadProgress(storage).status, "unavailable");
  assert.equal(saveProgress(next.saved.progress, storage), false);
  assert.equal(raw, JSON.stringify(initial));
  denyRead = false;
  assert.deepEqual(loadProgress(storage), {
    progress: initial,
    status: "saved",
  });
  denyWrite = false;
  // A read does not silently retry a failed write.
  assert.equal(raw, JSON.stringify(initial));
  assert.equal(saveProgress(next.saved.progress, storage), true);
  assert.deepEqual(loadProgress(storage), {
    progress: next.saved.progress,
    status: "saved",
  });
});

test("snapshot writes remain last-writer-wins if two tabs read before either writes", () => {
  let raw = JSON.stringify(freshProgress());
  const storage = () => ({
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  });
  // Model the race beyond the controller's read-before-write check: both reads finish first.
  const left = createRouteVisit(loadProgress(storage));
  const right = createRouteVisit(loadProgress(storage));
  const leftTurn = routeTransition(left, { type: "turn", index: 0 })!;
  const rightTurn = routeTransition(right, { type: "turn", index: 1 })!;
  assert.equal(saveProgress(leftTurn.saved.progress, storage), true);
  assert.equal(saveProgress(rightTurn.saved.progress, storage), true);
  const final = loadProgress(storage).progress;
  assert.deepEqual(final, rightTurn.saved.progress);
  assert.equal(
    final.boards[0].tiles[0],
    left.saved.progress.boards[0].tiles[0],
  );
  assert.notEqual(
    final.boards[0].tiles[0],
    leftTurn.saved.progress.boards[0].tiles[0],
  );
});
