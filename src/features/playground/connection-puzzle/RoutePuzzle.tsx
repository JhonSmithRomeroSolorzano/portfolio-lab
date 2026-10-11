import { useRef, useState } from "react";
import {
  EAST,
  NORTH,
  SOUTH,
  WEST,
  PUZZLES,
  portNames,
  rotateTile,
  routeHint,
  startingBoard,
  traceRoute,
} from "../../../domain/playground/route-puzzle";

import {
  loadProgress,
  saveProgress,
  type PuzzleBoard,
  type RouteProgress,
} from "./route-progress";

export function RoutePuzzle() {
  const [saved, setSaved] = useState(() => loadProgress());
  const { progress, status } = saved;
  const level = progress.level;
  const { tiles, moves } = progress.boards[level];
  const [history, setHistory] = useState<PuzzleBoard[][]>(() =>
    PUZZLES.map(() => []),
  );
  const [hint, setHint] = useState<ReturnType<typeof routeHint>>(null);
  const [focused, setFocused] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const route = traceRoute(tiles);
  function save(next: RouteProgress) {
    // Persist in the interaction itself so an immediate reload keeps this turn.
    const stored = saveProgress(next);
    setSaved({ progress: next, status: stored ? "saved" : "unavailable" });
  }
  function updateBoard(board: PuzzleBoard) {
    save({
      ...progress,
      boards: progress.boards.map((previous, i) =>
        i === level ? board : previous,
      ),
    });
  }
  function select(next: number) {
    setHint(null);
    save({ ...progress, level: next });
  }
  function reset() {
    updateBoard({ tiles: startingBoard(level), moves: 0 });
    setHistory((current) =>
      current.map((turns, i) => (i === level ? [] : turns)),
    );
    setHint(null);
  }
  function turn(index: number) {
    setHint(null);
    setHistory((current) =>
      current.map((turns, i) =>
        i === level ? [...turns.slice(-99), { tiles, moves }] : turns,
      ),
    );
    updateBoard({
      tiles: tiles.map((tile, i) => (i === index ? rotateTile(tile) : tile)),
      moves: moves + 1,
    });
  }
  function undo() {
    const previous = history[level].at(-1);
    if (!previous) return;
    setHint(null);
    updateBoard(previous);
    setHistory((current) =>
      current.map((turns, i) => (i === level ? turns.slice(0, -1) : turns)),
    );
    buttons.current[focused]?.focus();
  }
  return (
    <div className="route-game">
      <div className="route-instructions">
        <span className="play-kicker">02 / A LITTLE LOGIC</span>
        <h3 id="route-title">
          Make a <br />
          <em>connection.</em>
        </h3>
        <p>
          One signal. A tangle of paths. Connect the left edge of the top-left
          tile to the right edge of the bottom-right tile.
        </p>
        <p className="play-help" id="route-help">
          Click or press Space to turn a tile. Arrow keys move between tiles. No
          clock. Take your time.
        </p>
        <label className="play-field" htmlFor="route-level">
          Choose a puzzle
          <select
            id="route-level"
            value={level}
            onChange={(e) => select(Number(e.target.value))}
          >
            {PUZZLES.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
                {traceRoute(progress.boards[i].tiles).won ? " — connected" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="play-actions">
          <button onClick={undo} disabled={!history[level].length}>
            Undo turn
          </button>
          <button onClick={() => reset()}>Start again</button>
          <button
            onClick={() => setHint(routeHint(tiles, level))}
            disabled={route.won}
          >
            Give me a hint
          </button>
        </div>
        <div className="route-hint">
          <p role="status" aria-atomic="true">
            {hint &&
              `One possible path: turn row ${Math.floor(hint.index / 4) + 1}, column ${(hint.index % 4) + 1} until it connects ${portNames(hint.ports)}.`}
          </p>
          {hint && (
            <button onClick={() => buttons.current[hint.index]?.focus()}>
              Go to hinted tile →
            </button>
          )}
        </div>
      </div>
      <div className="route-console">
        <div className="route-score">
          <span>{PUZZLES[level].name}</span>
          <span>
            {moves} {moves === 1 ? "turn" : "turns"}
          </span>
        </div>
        <div
          className={`route-board ${route.won ? "is-connected" : ""}`}
          role="group"
          aria-label="Connection puzzle"
          aria-describedby="route-help"
        >
          <span className="route-port route-in" aria-hidden="true">
            IN →
          </span>
          {tiles.map((tile, i) => (
            <button
              key={i}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              tabIndex={focused === i ? 0 : -1}
              onFocus={() => setFocused(i)}
              onClick={() => turn(i)}
              onKeyDown={(e) => {
                const row = Math.floor(i / 4),
                  col = i % 4;
                const next =
                  e.key === "ArrowRight"
                    ? row * 4 + Math.min(col + 1, 3)
                    : e.key === "ArrowLeft"
                      ? row * 4 + Math.max(col - 1, 0)
                      : e.key === "ArrowDown"
                        ? Math.min(row + 1, 3) * 4 + col
                        : e.key === "ArrowUp"
                          ? Math.max(row - 1, 0) * 4 + col
                          : e.key === "Home"
                            ? row * 4
                            : e.key === "End"
                              ? row * 4 + 3
                              : null;
                if (next !== null) {
                  e.preventDefault();
                  buttons.current[next]?.focus();
                }
              }}
              className={`route-tile ${route.cells.includes(i) ? "has-signal" : ""} ${hint?.index === i ? "is-hinted" : ""}`}
              aria-label={`Row ${Math.floor(i / 4) + 1}, column ${(i % 4) + 1}: ${portNames(tile)}${hint?.index === i ? ", hinted tile" : ""}${route.cells.includes(i) ? ", signal connected" : ""}. Rotate clockwise.`}
            >
              <svg viewBox="0 0 64 64" aria-hidden="true">
                {[
                  [NORTH, 32, 0],
                  [EAST, 64, 32],
                  [SOUTH, 32, 64],
                  [WEST, 0, 32],
                ].map(([port, x, y]) =>
                  tile & port ? (
                    <path key={port} d={`M32 32 L${x} ${y}`} />
                  ) : null,
                )}
                <circle cx="32" cy="32" r="5" />
              </svg>
            </button>
          ))}
          <span className="route-port route-out" aria-hidden="true">
            → OUT
          </span>
        </div>
        <p
          className="route-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {route.won
            ? `Connection made in ${moves} ${moves === 1 ? "turn" : "turns"}. IN and OUT are connected.`
            : `${route.cells.length} of 16 tiles carry the signal. Find a path to OUT.`}
        </p>
        {route.won && (
          <button
            className="route-next"
            onClick={() => {
              select((level + 1) % PUZZLES.length);
              buttons.current[0]?.focus();
            }}
          >
            {level === PUZZLES.length - 1
              ? "Return to first puzzle"
              : "Next puzzle"}{" "}
            →
          </button>
        )}
        <p className="route-save" role="status">
          {status === "saved"
            ? "Progress saved in this browser. Undo is available for this visit."
            : status === "unavailable"
              ? "Progress is available for this visit only; browser storage is unavailable."
              : status === "invalid"
                ? "Saved progress could not be read. Your next move will start a fresh save."
                : "Your first move saves progress in this browser. No account needed."}
        </p>
        <span className="route-footnote">
          A browser puzzle, made for a small pause.
        </span>
      </div>
    </div>
  );
}
