import { useRef, useState } from "react";
import {
  EAST,
  NORTH,
  SOUTH,
  WEST,
  PUZZLES,
  portNames,
  rotateTile,
  startingBoard,
  traceRoute,
} from "./route-puzzle";

export function RoutePuzzle() {
  const [level, setLevel] = useState(0);
  const [tiles, setTiles] = useState(() => startingBoard(0));
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<{ tiles: number[]; moves: number }[]>(
    [],
  );
  const [focused, setFocused] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const route = traceRoute(tiles);
  function reset(next = level) {
    setLevel(next);
    setTiles(startingBoard(next));
    setMoves(0);
    setHistory([]);
  }
  function turn(index: number) {
    setHistory((current) => [...current.slice(-99), { tiles, moves }]);
    setTiles((current) =>
      current.map((tile, i) => (i === index ? rotateTile(tile) : tile)),
    );
    setMoves((current) => current + 1);
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setTiles(previous.tiles);
    setMoves(previous.moves);
    setHistory((current) => current.slice(0, -1));
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
          One signal. A tangle of paths. Rotate the tiles to connect IN to OUT.
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
            onChange={(e) => reset(Number(e.target.value))}
          >
            {PUZZLES.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="play-actions">
          <button onClick={undo} disabled={!history.length}>
            Undo turn
          </button>
          <button onClick={() => reset()}>Start again</button>
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
              className={`route-tile ${route.cells.includes(i) ? "has-signal" : ""}`}
              aria-label={`Row ${Math.floor(i / 4) + 1}, column ${(i % 4) + 1}: ${portNames(tile)}${route.cells.includes(i) ? ", signal connected" : ""}. Rotate clockwise.`}
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
            ? `Connection made in ${moves} turns. Try another puzzle?`
            : `${route.cells.length} of 16 tiles carry the signal. Find a path to OUT.`}
        </p>
        <span className="route-footnote">
          A browser puzzle, made for a small pause.
        </span>
      </div>
    </div>
  );
}
