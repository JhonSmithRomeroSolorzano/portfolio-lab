import {
  emptyRecord,
  type PuzzleRecord,
} from "../../../domain/playground/puzzle-records";
import {
  PUZZLES,
  rotateTile,
  startingBoard,
} from "../../../domain/playground/route-puzzle";

export const ROUTE_PROGRESS_KEY = "jsr-connection-progress-v1";
export type PuzzleBoard = {
  tiles: number[];
  moves: number;
  assisted: boolean;
  rotations: number | null;
};
export type RouteProgress = {
  version: 2;
  level: number;
  boards: PuzzleBoard[];
  records: PuzzleRecord[];
};
type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;
export type ProgressStatus = "new" | "saved" | "invalid" | "unavailable";

export function freshProgress(): RouteProgress {
  return {
    version: 2,
    level: 0,
    boards: PUZZLES.map((_, level) => ({
      tiles: startingBoard(level),
      moves: 0,
      assisted: false,
      rotations: 0,
    })),
    records: PUZZLES.map(emptyRecord),
  };
}

export function parseProgress(raw: string): RouteProgress | null {
  if (raw.length > 4096) return null;
  try {
    const data = JSON.parse(raw);
    if (
      (data?.version !== 1 && data?.version !== 2) ||
      !Number.isInteger(data.level) ||
      data.level < 0 ||
      data.level >= PUZZLES.length ||
      !Array.isArray(data.boards) ||
      data.boards.length !== PUZZLES.length
    )
      return null;
    const records: PuzzleRecord[] = PUZZLES.map(emptyRecord);
    if (data.version === 2) {
      if (
        !Array.isArray(data.records) ||
        data.records.length !== PUZZLES.length
      )
        return null;
      for (let i = 0; i < data.records.length; i++) {
        const record = data.records[i];
        for (const category of ["unassisted", "assisted"] as const) {
          const value = record?.[category];
          if (value !== null && (!Number.isSafeInteger(value) || value < 1))
            return null;
          records[i][category] = value;
        }
      }
    }
    const boards: PuzzleBoard[] = [];
    for (let level = 0; level < PUZZLES.length; level++) {
      const board = data.boards[level];
      if (
        !Number.isSafeInteger(board?.moves) ||
        board.moves < 0 ||
        !Array.isArray(board.tiles) ||
        board.tiles.length !== 16
      )
        return null;
      const start = startingBoard(level);
      for (let i = 0; i < 16; i++) {
        const tile = board.tiles[i];
        let expected = start[i];
        const rotations = [expected];
        for (let n = 0; n < 3; n++) {
          expected = rotateTile(expected);
          rotations.push(expected);
        }
        // A saved rotation may not replace a straight tile with a corner.
        if (!Number.isInteger(tile) || !rotations.includes(tile)) return null;
      }
      if (
        data.version === 2 &&
        (typeof board.assisted !== "boolean" ||
          (board.rotations !== null &&
            (!Number.isSafeInteger(board.rotations) ||
              board.rotations < board.moves)))
      )
        return null;
      boards.push({
        tiles: [...board.tiles],
        moves: board.moves,
        assisted: data.version === 2 ? board.assisted : false,
        rotations: data.version === 2 ? board.rotations : null,
      });
    }
    return { version: 2, level: data.level, boards, records };
  } catch {
    return null;
  }
}

export function loadProgress(
  storage: StorageAccess = () => window.localStorage,
): {
  progress: RouteProgress;
  status: ProgressStatus;
} {
  try {
    const raw = storage().getItem(ROUTE_PROGRESS_KEY);
    if (raw === null) return { progress: freshProgress(), status: "new" };
    const progress = parseProgress(raw);
    return progress
      ? { progress, status: "saved" }
      : { progress: freshProgress(), status: "invalid" };
  } catch {
    return { progress: freshProgress(), status: "unavailable" };
  }
}

export function saveProgress(
  progress: RouteProgress,
  storage: StorageAccess = () => window.localStorage,
) {
  try {
    storage().setItem(ROUTE_PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
