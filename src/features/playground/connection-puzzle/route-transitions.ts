import { recordCompletion } from "../../../domain/playground/puzzle-records";
import {
  PUZZLES,
  rotateTile,
  routeHint,
  startingBoard,
  traceRoute,
} from "../../../domain/playground/route-puzzle";
import type {
  LoadedProgress,
  PuzzleBoard,
  RouteProgress,
} from "./route-progress";

export type RouteVisit = {
  readonly saved: LoadedProgress;
  readonly history: readonly (readonly PuzzleBoard[])[];
  readonly hint: Readonly<ReturnType<typeof routeHint>>;
  readonly notice: string;
};

export type RouteAction =
  | { readonly type: "select"; readonly level: number }
  | { readonly type: "turn"; readonly index: number }
  | { readonly type: "reset" }
  | { readonly type: "undo" }
  | { readonly type: "hint" };

export function createRouteVisit(saved: LoadedProgress): RouteVisit {
  return {
    saved,
    history: PUZZLES.map(() => []),
    hint: null,
    notice: "",
  };
}

/** Pure visit controls; callers supply the same valid indices as the puzzle UI. */
export function routeTransition(
  visit: RouteVisit,
  action: RouteAction,
): RouteVisit | null {
  const { progress } = visit.saved;
  const { level } = progress;
  let board = progress.boards[level];
  let history = visit.history;
  let hint: RouteVisit["hint"] = null;
  switch (action.type) {
    case "select":
      return {
        ...visit,
        saved: {
          ...visit.saved,
          progress: { ...progress, level: action.level },
        },
        hint: null,
      };
    case "turn":
      history = history.map((turns, i) =>
        i === level ? [...turns.slice(-99), board] : turns,
      );
      board = {
        tiles: board.tiles.map((tile, i) =>
          i === action.index ? rotateTile(tile) : tile,
        ),
        moves: board.moves + 1,
        assisted: board.assisted,
        rotations: board.rotations === null ? null : board.rotations + 1,
      };
      break;
    case "reset":
      board = {
        tiles: startingBoard(level),
        moves: 0,
        assisted: false,
        rotations: 0,
      };
      history = history.map((turns, i) => (i === level ? [] : turns));
      break;
    case "undo": {
      const previous = history[level].at(-1);
      if (!previous) return null;
      board = {
        ...previous,
        assisted: board.assisted,
        rotations: board.rotations,
      };
      history = history.map((turns, i) =>
        i === level ? turns.slice(0, -1) : turns,
      );
      break;
    }
    case "hint":
      board = { ...board, assisted: true };
      hint = routeHint(board.tiles, level);
      break;
  }
  return {
    ...visit,
    saved: {
      ...visit.saved,
      progress: {
        ...progress,
        records: traceRoute(board.tiles).won
          ? progress.records.map((record, i) =>
              i === level
                ? recordCompletion(record, board.rotations, board.assisted)
                : record,
            )
          : progress.records,
        boards: progress.boards.map((previous, i) =>
          i === level ? board : previous,
        ),
      },
    },
    history,
    hint,
  };
}

/** A refused write changes persistence feedback, not the accepted local action. */
export function settleRouteSave(
  visit: RouteVisit,
  stored: boolean,
): RouteVisit {
  return {
    ...visit,
    saved: { ...visit.saved, status: stored ? "saved" : "unavailable" },
    notice: "",
  };
}

function sameBoard(left: PuzzleBoard, right: PuzzleBoard) {
  return (
    left.moves === right.moves &&
    left.assisted === right.assisted &&
    left.rotations === right.rotations &&
    left.tiles.every((tile, i) => tile === right.tiles[i])
  );
}

/** Compare content with the last observed save, not unsaved play or tab selection. */
export function hasRouteUpdate(
  knownSave: RouteProgress,
  incoming: LoadedProgress,
): boolean {
  return (
    incoming.status !== "invalid" &&
    incoming.status !== "unavailable" &&
    (!incoming.progress.boards.every((board, i) =>
      sameBoard(board, knownSave.boards[i]),
    ) ||
      !incoming.progress.records.every(
        (record, i) =>
          record.assisted === knownSave.records[i].assisted &&
          record.unassisted === knownSave.records[i].unassisted,
      ))
  );
}

export function reconcileRouteVisit(
  visit: RouteVisit,
  knownSave: RouteProgress,
  incoming: LoadedProgress,
): RouteVisit {
  if (incoming.status === "invalid" || incoming.status === "unavailable") {
    return visit.saved.status === incoming.status && visit.notice === ""
      ? visit
      : {
          ...visit,
          saved: { ...visit.saved, status: incoming.status },
          notice: "",
        };
  }
  if (!hasRouteUpdate(knownSave, incoming)) return visit;
  const { level, boards } = visit.saved.progress;
  const changed = boards.map(
    (board, i) => !sameBoard(board, incoming.progress.boards[i]),
  );
  return {
    saved: { ...incoming, progress: { ...incoming.progress, level } },
    history: visit.history.map((turns, i) => (changed[i] ? [] : turns)),
    hint: changed[level] ? null : visit.hint,
    notice:
      incoming.status === "new"
        ? "Saved progress was cleared in another tab. Start a new connection when you’re ready."
        : changed.some(Boolean)
          ? "Progress updated from another tab. Undo was cleared for the changed puzzles."
          : "Puzzle records updated from another tab.",
  };
}
