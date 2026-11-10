import type { PuzzleRecord } from "../src/domain/playground/puzzle-records";
import {
  freshProgress,
  loadProgress,
  parseProgress,
  type LoadedProgress,
  type PuzzleBoard,
  type RouteProgress,
} from "../src/features/playground/connection-puzzle/route-progress";
import {
  createRouteVisit,
  reconcileRouteVisit,
  routeTransition,
  settleRouteSave,
  type RouteAction,
  type RouteVisit,
} from "../src/features/playground/connection-puzzle/route-transitions";
import type { useRouteProgress } from "../src/features/playground/connection-puzzle/useRouteProgress";

// Compile-only contracts, included by tsconfig.json. Never execute these writes.
// Removing a readonly boundary must produce an unused @ts-expect-error error.
export function rejectSnapshotMutation(
  board: PuzzleBoard,
  progress: RouteProgress,
  loaded: LoadedProgress,
  visit: RouteVisit,
  record: PuzzleRecord,
  action: RouteAction,
  controller: ReturnType<typeof useRouteProgress>,
) {
  // @ts-expect-error Board fields cannot be replaced.
  board.tiles = [];
  // @ts-expect-error Tile values cannot be assigned.
  board.tiles[0] = 1;
  // @ts-expect-error Tile collections cannot grow or shrink.
  board.tiles.push(1);
  // @ts-expect-error Move metadata is immutable.
  board.moves++;
  // @ts-expect-error Assistance metadata is immutable.
  board.assisted = true;
  // @ts-expect-error Rotation metadata is immutable.
  board.rotations = 1;
  // @ts-expect-error Save version is immutable even when assigning the same value.
  progress.version = 2;
  // @ts-expect-error Selection changes must go through a transition.
  progress.level = 1;
  // @ts-expect-error Board collection cannot be replaced.
  progress.boards = [];
  // @ts-expect-error Individual board snapshots cannot be replaced.
  progress.boards[0] = board;
  // @ts-expect-error Board collection cannot grow or shrink.
  progress.boards.pop();
  // @ts-expect-error Record collection cannot be replaced.
  progress.records = [];
  // @ts-expect-error Individual records cannot be replaced.
  progress.records[0] = record;
  // @ts-expect-error Record collection cannot grow or shrink.
  progress.records.push(record);
  // @ts-expect-error Record values remain immutable through progress.
  progress.records[0].assisted = 1;
  // @ts-expect-error Standalone domain records are also immutable.
  record.unassisted = 1;
  // @ts-expect-error Both record categories are immutable.
  record.assisted = 1;
  // @ts-expect-error Loaded progress cannot be replaced.
  loaded.progress = progress;
  // @ts-expect-error Persistence feedback must go through settlement.
  loaded.status = "saved";
  // @ts-expect-error Visit persistence snapshot cannot be replaced.
  visit.saved = loaded;
  // @ts-expect-error Undo histories cannot be replaced.
  visit.history = [];
  // @ts-expect-error Per-puzzle Undo history cannot be replaced.
  visit.history[0] = [];
  // @ts-expect-error The outer Undo collection cannot grow or shrink.
  visit.history.push([]);
  // @ts-expect-error Individual Undo snapshots cannot be replaced.
  visit.history[0][0] = board;
  // @ts-expect-error Per-puzzle Undo history cannot grow or shrink.
  visit.history[0].pop();
  // @ts-expect-error Historical board tiles are also immutable.
  visit.history[0][0].tiles[0] = 1;
  if (visit.hint) {
    // @ts-expect-error Hint indices cannot change through an alias.
    visit.hint.index = 0;
    // @ts-expect-error Hint ports cannot change through an alias.
    visit.hint.ports = 1;
  }
  // @ts-expect-error Hint state cannot be replaced.
  visit.hint = null;
  // @ts-expect-error Notices belong to the transition result.
  visit.notice = "changed";
  if (action.type === "turn") {
    // @ts-expect-error Turn inputs are immutable.
    action.index = 0;
  }
  if (action.type === "select") {
    // @ts-expect-error Selection inputs are immutable.
    action.level = 0;
  }
  // @ts-expect-error Action discriminants are immutable.
  action.type = "reset";
  // @ts-expect-error Controller consumers cannot mutate live board state.
  controller.progress.boards[0].tiles[0] = 1;
  if (controller.hint) {
    // @ts-expect-error Controller hints retain the snapshot contract.
    controller.hint.index = 0;
  }
}

export function rejectResultMutation(
  loaded: LoadedProgress,
  visit: RouteVisit,
) {
  // @ts-expect-error Fresh progress is exposed as a snapshot, not a builder.
  freshProgress().boards[0].moves = 1;
  // @ts-expect-error Storage reads return immutable progress.
  loadProgress().progress.level = 1;
  const parsed = parseProgress("{}");
  if (parsed) {
    // @ts-expect-error Validated saves are immutable snapshots.
    parsed.boards[0].tiles.reverse();
  }
  // @ts-expect-error New visits retain immutable history.
  createRouteVisit(loaded).history[0].push(visit.saved.progress.boards[0]);
  const next = routeTransition(visit, { type: "turn", index: 0 });
  if (next) {
    // @ts-expect-error Accepted transitions return immutable nested snapshots.
    next.saved.progress.boards[0].rotations = 1;
  }
  // @ts-expect-error Settlement returns immutable persistence feedback.
  settleRouteSave(visit, true).saved.status = "new";
  const reconciled = reconcileRouteVisit(visit, loaded.progress, loaded);
  // @ts-expect-error Reconciliation returns immutable records.
  reconciled.saved.progress.records[0].unassisted = 1;
}

// Deeply readonly caller-owned values remain valid inputs, without casts or copies.
export function acceptReadonlyInputs() {
  const board = {
    tiles: [1, 2, 4, 8],
    moves: 0,
    assisted: false,
    rotations: 0,
  } as const;
  const loaded = {
    progress: {
      version: 2,
      level: 0,
      boards: [board],
      records: [{ unassisted: null, assisted: null }],
    },
    status: "new",
  } as const;
  const visit = {
    saved: loaded,
    history: [[board]],
    hint: { index: 0, ports: 1 },
    notice: "",
  } as const;
  createRouteVisit(loaded);
  routeTransition(visit, { type: "hint" } as const);
  settleRouteSave(visit, true);
  reconcileRouteVisit(visit, loaded.progress, loaded);
}
