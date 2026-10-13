import { recordCompletion } from "../../../domain/playground/puzzle-records";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PUZZLES,
  rotateTile,
  routeHint,
  startingBoard,
  traceRoute,
} from "../../../domain/playground/route-puzzle";
import {
  loadProgress,
  ROUTE_PROGRESS_KEY,
  saveProgress,
  type PuzzleBoard,
  type RouteProgress,
} from "./route-progress";

function sameBoard(left: PuzzleBoard, right: PuzzleBoard) {
  return (
    left.moves === right.moves &&
    left.assisted === right.assisted &&
    left.rotations === right.rotations &&
    left.tiles.every((tile, i) => tile === right.tiles[i])
  );
}

/** Own the visit's controls and reconcile browser saves without moving focus. */
export function useRouteProgress() {
  const [saved, setSaved] = useState(() => loadProgress());
  const { progress } = saved;
  const knownSave = useRef(progress);
  const [history, setHistory] = useState<PuzzleBoard[][]>(() =>
    PUZZLES.map(() => []),
  );
  const [hint, setHint] = useState<ReturnType<typeof routeHint>>(null);
  const [notice, setNotice] = useState("");
  const level = progress.level;
  const { tiles, moves } = progress.boards[level];

  const refresh = useCallback(() => {
    const incoming = loadProgress();
    if (incoming.status === "invalid" || incoming.status === "unavailable") {
      setSaved((current) =>
        current.status === incoming.status
          ? current
          : { ...current, status: incoming.status },
      );
      setNotice("");
      return false;
    }
    // Compare with the last observed save, not unsaved play after a quota failure.
    if (
      incoming.progress.boards.every((board, i) =>
        sameBoard(board, knownSave.current.boards[i]),
      ) &&
      incoming.progress.records.every(
        (record, i) =>
          record.assisted === knownSave.current.records[i].assisted &&
          record.unassisted === knownSave.current.records[i].unassisted,
      )
    )
      return false;
    knownSave.current = incoming.progress;
    const changed = progress.boards.map(
      (board, i) => !sameBoard(board, incoming.progress.boards[i]),
    );
    setSaved({
      ...incoming,
      progress: { ...incoming.progress, level: progress.level },
    });
    setHistory((current) =>
      current.map((turns, i) => (changed[i] ? [] : turns)),
    );
    if (changed[progress.level]) setHint(null);
    setNotice(
      incoming.status === "new"
        ? "Saved progress was cleared in another tab. Start a new connection when you’re ready."
        : changed.some(Boolean)
          ? "Progress updated from another tab. Undo was cleared for the changed puzzles."
          : "Puzzle records updated from another tab.",
    );
    return true;
  }, [progress]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== null && event.key !== ROUTE_PROGRESS_KEY) return;
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  function save(next: RouteProgress) {
    // A suspended tab may receive its storage event after the next interaction.
    if (refresh()) {
      setNotice(
        "Progress changed in another tab. The latest save is loaded; try your action again.",
      );
      return false;
    }
    const stored = saveProgress(next);
    if (stored) knownSave.current = next;
    setSaved({ progress: next, status: stored ? "saved" : "unavailable" });
    setNotice("");
    return true;
  }
  function updateBoard(board: PuzzleBoard) {
    return save({
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
    });
  }
  function select(next: number) {
    if (save({ ...progress, level: next })) setHint(null);
  }
  function reset() {
    if (
      !updateBoard({
        tiles: startingBoard(level),
        moves: 0,
        assisted: false,
        rotations: 0,
      })
    )
      return;
    setHistory((current) =>
      current.map((turns, i) => (i === level ? [] : turns)),
    );
    setHint(null);
  }
  function turn(index: number) {
    if (
      !updateBoard({
        tiles: tiles.map((tile, i) => (i === index ? rotateTile(tile) : tile)),
        moves: moves + 1,
        assisted: progress.boards[level].assisted,
        rotations:
          progress.boards[level].rotations === null
            ? null
            : progress.boards[level].rotations + 1,
      })
    )
      return;
    setHistory((current) =>
      current.map((turns, i) =>
        i === level ? [...turns.slice(-99), progress.boards[level]] : turns,
      ),
    );
    setHint(null);
  }
  function undo() {
    const previous = history[level].at(-1);
    if (
      !previous ||
      !updateBoard({
        ...previous,
        assisted: progress.boards[level].assisted,
        rotations: progress.boards[level].rotations,
      })
    )
      return false;
    setHistory((current) =>
      current.map((turns, i) => (i === level ? turns.slice(0, -1) : turns)),
    );
    setHint(null);
    return true;
  }

  return {
    ...saved,
    notice,
    hint,
    canUndo: history[level].length > 0,
    select,
    reset,
    turn,
    undo,
    giveHint: () => {
      if (updateBoard({ ...progress.boards[level], assisted: true }))
        setHint(routeHint(tiles, level));
    },
  };
}
