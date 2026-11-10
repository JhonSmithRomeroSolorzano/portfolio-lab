import assert from "node:assert/strict";
import test from "node:test";
import {
  rotateTile,
  routeHint,
  solvedBoard,
  startingBoard,
  traceRoute,
} from "../src/domain/playground/route-puzzle";
import {
  freshProgress,
  parseProgress,
  type LoadedProgress,
} from "../src/features/playground/connection-puzzle/route-progress";
import {
  createRouteVisit,
  hasRouteUpdate,
  reconcileRouteVisit,
  routeTransition,
  settleRouteSave,
  type RouteAction,
  type RouteVisit,
} from "../src/features/playground/connection-puzzle/route-transitions";

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

const fresh = () =>
  createRouteVisit({ progress: freshProgress(), status: "new" });
function act(visit: RouteVisit, action: RouteAction, stored = true) {
  const next = routeTransition(freeze(visit), action);
  assert.ok(next);
  return settleRouteSave(freeze(next), stored);
}

test("visit starts with independent empty histories and no derived hints or notices", () => {
  const visit = fresh();
  assert.equal(visit.saved.status, "new");
  assert.deepEqual(visit.history, [[], [], []]);
  assert.notEqual(visit.history[0], visit.history[1]);
  assert.equal(visit.hint, null);
  assert.equal(visit.notice, "");
  assert.equal(routeTransition(freeze(visit), { type: "undo" }), null);
});

test("turns preserve other puzzles, cap undo history, and track cumulative rotations", () => {
  const original = fresh();
  let visit = original;
  for (let i = 0; i < 120; i++) visit = act(visit, { type: "turn", index: 0 });
  assert.equal(visit.saved.progress.boards[0].moves, 120);
  assert.equal(visit.saved.progress.boards[0].rotations, 120);
  assert.equal(visit.history[0].length, 100);
  assert.equal(visit.history[0][0].moves, 20);
  assert.equal(
    visit.saved.progress.boards[1],
    original.saved.progress.boards[1],
  );
  assert.equal(visit.history[1], original.history[1]);
  assert.equal(visit.saved.progress.records, original.saved.progress.records);
  assert.deepEqual(original.saved.progress.boards[0].tiles, startingBoard(0));
});

test("hints and cumulative rotation counts survive undo without restoring a hint", () => {
  const original = fresh();
  const turned = act(original, { type: "turn", index: 0 });
  const hinted = act(turned, { type: "hint" });
  assert.deepEqual(
    hinted.hint,
    routeHint(turned.saved.progress.boards[0].tiles, 0),
  );
  assert.equal(hinted.history, turned.history);
  assert.equal(hinted.saved.progress.boards[0].moves, 1);
  const undone = act(hinted, { type: "undo" });
  assert.deepEqual(undone.saved.progress.boards[0], {
    ...original.saved.progress.boards[0],
    assisted: true,
    rotations: 1,
  });
  assert.equal(undone.hint, null);
  assert.equal(undone.history[0].length, 0);
  const next = act(undone, { type: "turn", index: 1 });
  assert.equal(next.saved.progress.boards[0].moves, 1);
  assert.equal(next.saved.progress.boards[0].rotations, 2);
  assert.equal(next.saved.progress.boards[0].assisted, true);
});

test("selection keeps per-puzzle history and reset affects only the selected attempt", () => {
  let visit = act(fresh(), { type: "turn", index: 0 });
  const firstBoard = visit.saved.progress.boards[0];
  const firstHistory = visit.history[0];
  visit = act(visit, { type: "select", level: 1 });
  visit = act(visit, { type: "turn", index: 4 });
  visit = act(visit, { type: "hint" });
  const selected = act(visit, { type: "select", level: 1 });
  assert.equal(selected.hint, null);
  assert.equal(selected.history, visit.history);
  const reset = act(selected, { type: "reset" });
  assert.deepEqual(reset.saved.progress.boards[1], freshProgress().boards[1]);
  assert.equal(reset.saved.progress.boards[0], firstBoard);
  assert.equal(reset.history[0], firstHistory);
  assert.deepEqual(reset.history[1], []);
});

function nearWin(assisted = false, rotations: number | null = 10) {
  const visit = fresh();
  const tiles = solvedBoard(0);
  for (let i = 0; i < 3; i++) tiles[0] = rotateTile(tiles[0]);
  visit.saved.progress.boards[0] = { tiles, moves: 8, rotations, assisted };
  return visit;
}

test("completion records the correct category and reset preserves the best", () => {
  for (const assisted of [false, true]) {
    const category = assisted ? "assisted" : "unassisted";
    const completed = act(nearWin(assisted), { type: "turn", index: 0 });
    assert.equal(
      traceRoute(completed.saved.progress.boards[0].tiles).won,
      true,
    );
    assert.equal(completed.saved.progress.records[0][category], 11);
    const reset = act(completed, { type: "reset" });
    assert.equal(reset.saved.progress.records[0][category], 11);
    assert.equal(reset.saved.progress.boards[0].rotations, 0);
    assert.equal(reset.saved.progress.boards[0].assisted, false);
  }
  const legacy = act(nearWin(false, null), { type: "turn", index: 0 });
  assert.equal(legacy.saved.progress.boards[0].rotations, null);
  assert.deepEqual(legacy.saved.progress.records, freshProgress().records);
});

test("a denied write preserves playable progress and undo against the last observed save", () => {
  const initial = fresh();
  const knownSave = initial.saved.progress;
  const local = act(initial, { type: "turn", index: 0 }, false);
  assert.equal(local.saved.status, "unavailable");
  assert.equal(local.saved.progress.boards[0].moves, 1);
  assert.equal(local.history[0].length, 1);
  const unchanged: LoadedProgress = { progress: knownSave, status: "saved" };
  assert.equal(hasRouteUpdate(knownSave, unchanged), false);
  assert.equal(reconcileRouteVisit(freeze(local), knownSave, unchanged), local);
  const undone = act(local, { type: "undo" }, false);
  assert.equal(undone.saved.progress.boards[0].moves, 0);
  assert.equal(undone.saved.progress.boards[0].rotations, 1);
  const retried = act(undone, { type: "turn", index: 1 });
  assert.equal(retried.saved.status, "saved");
  assert.equal(retried.saved.progress.boards[0].rotations, 2);
});

test("invalid or unavailable reads preserve local boards, histories, hints and checkpoint", () => {
  const local = act(act(fresh(), { type: "turn", index: 0 }), { type: "hint" });
  const withNotice = { ...local, notice: "A previous notice" };
  for (const status of ["invalid", "unavailable"] as const) {
    const incoming = freeze({ progress: freshProgress(), status });
    assert.equal(hasRouteUpdate(local.saved.progress, incoming), false);
    const next = reconcileRouteVisit(
      freeze(withNotice),
      local.saved.progress,
      incoming,
    );
    assert.equal(next.saved.status, status);
    assert.equal(next.saved.progress, local.saved.progress);
    assert.equal(next.history, local.history);
    assert.equal(next.hint, local.hint);
    assert.equal(next.notice, "");
    assert.equal(
      reconcileRouteVisit(freeze(next), local.saved.progress, incoming),
      next,
    );
  }
});

test("remote changes clear only obsolete history and hints, keeping the selected puzzle", () => {
  let local = act(fresh(), { type: "turn", index: 0 });
  local = act(local, { type: "select", level: 1 });
  local = act(local, { type: "turn", index: 4 });
  local = act(local, { type: "hint" });
  const knownSave = local.saved.progress;
  let remote = act(local, { type: "select", level: 0 });
  remote = act(remote, { type: "turn", index: 1 });
  assert.equal(hasRouteUpdate(knownSave, remote.saved), true);
  const next = reconcileRouteVisit(
    freeze(local),
    knownSave,
    freeze(remote.saved),
  );
  assert.equal(next.saved.progress.level, 1);
  assert.deepEqual(next.history[0], []);
  assert.equal(next.history[1], local.history[1]);
  assert.equal(next.hint, local.hint);
  assert.match(next.notice, /Undo was cleared/);
  remote = act(remote, { type: "select", level: 1 });
  remote = act(remote, { type: "turn", index: 5 });
  const changedActive = reconcileRouteVisit(
    freeze(next),
    next.saved.progress,
    freeze(remote.saved),
  );
  assert.deepEqual(changedActive.history[1], []);
  assert.equal(changedActive.hint, null);
});

test("record-only changes keep undo and hints; selection-only changes are ignored", () => {
  const local = act(act(fresh(), { type: "turn", index: 0 }), { type: "hint" });
  const knownSave = local.saved.progress;
  const selectionOnly = {
    ...local.saved,
    progress: { ...knownSave, level: 2 },
  };
  assert.equal(hasRouteUpdate(knownSave, selectionOnly), false);
  assert.equal(
    reconcileRouteVisit(freeze(local), knownSave, selectionOnly),
    local,
  );
  const records = [
    { unassisted: 5, assisted: null },
    ...knownSave.records.slice(1),
  ];
  const incoming = { ...local.saved, progress: { ...knownSave, records } };
  const next = reconcileRouteVisit(freeze(local), knownSave, freeze(incoming));
  assert.deepEqual(next.history, local.history);
  assert.equal(next.hint, local.hint);
  assert.deepEqual(next.saved.progress.records, records);
  assert.match(next.notice, /records updated/);
});

test("an external clear resets boards without changing selection or writing a save", () => {
  let local = act(fresh(), { type: "turn", index: 0 });
  local = act(local, { type: "select", level: 2 });
  local = act(local, { type: "turn", index: 8 });
  local = act(local, { type: "hint" });
  const incoming = freeze({
    progress: freshProgress(),
    status: "new" as const,
  });
  const next = reconcileRouteVisit(
    freeze(local),
    local.saved.progress,
    incoming,
  );
  assert.equal(next.saved.progress.level, 2);
  assert.equal(next.saved.status, "new");
  assert.deepEqual(next.saved.progress.boards, incoming.progress.boards);
  assert.deepEqual(next.history, [[], [], []]);
  assert.equal(next.hint, null);
  assert.match(next.notice, /cleared in another tab/);
});

test("seeded action and save sequences preserve serializable progress and undo invariants", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let random = seed;
    const pick = (limit: number) => {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      return random % limit;
    };
    let visit = fresh();
    let knownSave = visit.saved.progress;
    for (let step = 0; step < 100; step++) {
      const actions: RouteAction[] = [
        { type: "turn", index: pick(16) },
        { type: "select", level: pick(3) },
        { type: "undo" },
        { type: "reset" },
        { type: "hint" },
      ];
      const action = actions[pick(actions.length)];
      const before = visit.saved.progress;
      const next = routeTransition(freeze(visit), action);
      if (next) {
        if (action.type === "undo") {
          const board = next.saved.progress.boards[before.level];
          assert.equal(board.rotations, before.boards[before.level].rotations);
          assert.equal(board.assisted, before.boards[before.level].assisted);
        }
        const stored = pick(4) !== 0;
        visit = settleRouteSave(freeze(next), stored);
        if (stored) knownSave = visit.saved.progress;
      }
      const unchanged = { progress: knownSave, status: "saved" as const };
      assert.equal(
        reconcileRouteVisit(freeze(visit), knownSave, unchanged),
        visit,
      );
      assert.deepEqual(
        parseProgress(JSON.stringify(visit.saved.progress)),
        visit.saved.progress,
      );
      assert.ok(visit.history.every((turns) => turns.length <= 100));
      if (step % 17 === 0) {
        const remote = act(createRouteVisit(unchanged), {
          type: "turn",
          index: pick(16),
        });
        const selected = visit.saved.progress.level;
        visit = reconcileRouteVisit(
          freeze(visit),
          knownSave,
          freeze(remote.saved),
        );
        assert.equal(visit.saved.progress.level, selected);
        knownSave = remote.saved.progress;
      }
    }
  }
});
