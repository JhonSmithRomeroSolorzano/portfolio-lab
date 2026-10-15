import { useCallback, useRef, useState, type PointerEvent } from "react";
import {
  LOCKS,
  lockState,
  pinLevel,
  PIN_MAX,
} from "../../../domain/playground/pin-lock";
import { usePlaybackInterruption } from "../../../shared/hooks/usePlaybackInterruption";
import art from "./lock-art.json";

const ACTIVE_HASHES = ["#pin-lock"];
const raw = (html: string) => <g dangerouslySetInnerHTML={{ __html: html }} />;
const fixed = {
  floor: raw(art.floor),
  housing: raw(art.housing),
  beam: raw(art.beam),
  bolt: raw(art.bolt),
  front: raw(art.front),
  cover: raw(art.cover),
  upper: raw(art.upper),
  shearEnds: raw(art.shearEnds),
};
const lower = art.lower.map((pattern) => pattern.map(raw));
const lowerHit = art.lower.map((pattern) =>
  pattern.map((html) => html.match(/class="iso-fill" d="([^"]+)"/)?.[1]),
);
const lifters = art.lifters.map(raw);
function shift(x: number, y: number, z: number) {
  const [a, b, c] = art.axes;
  return `translate(${a[0] * x + b[0] * y + c[0] * z}px, ${a[1] * x + b[1] * y + c[1] * z}px)`;
}

export function PinLock() {
  const [pattern, setPattern] = useState(0);
  const [levels, setLevels] = useState<number[]>([...LOCKS[0].start]);
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedPin, setSelectedPin] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: number;
    pin: number;
    y: number;
    level: number;
    step: number;
  } | null>(null);
  const state = lockState(LOCKS[pattern].cuts, levels);

  const stopDrag = useCallback(() => {
    const gesture = drag.current;
    drag.current = null;
    if (gesture && svg.current?.hasPointerCapture(gesture.id))
      svg.current.releasePointerCapture(gesture.id);
    setDragging(false);
  }, []);
  usePlaybackInterruption(stopDrag, {
    target: scene,
    activeHashes: ACTIVE_HASHES,
  });

  function adjust(index: number, value: number) {
    if (open) return;
    setSelectedPin(index);
    setLevels((previous) =>
      previous.map((level, i) => (i === index ? pinLevel(value) : level)),
    );
    setFailed(false);
  }
  function startDrag(event: PointerEvent<SVGGElement>, pin: number) {
    if (
      open ||
      drag.current ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    const node = svg.current;
    if (!node) return;
    event.preventDefault();
    drag.current = {
      id: event.pointerId,
      pin,
      y: event.clientY,
      level: levels[pin],
      step:
        (Math.abs(art.axes[2][1]) * 8 * node.getBoundingClientRect().height) /
        480,
    };
    node.setPointerCapture(event.pointerId);
    setSelectedPin(pin);
    setDragging(true);
  }
  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    adjust(
      gesture.pin,
      gesture.level + (gesture.y - event.clientY) / gesture.step,
    );
  }
  function reset(next = pattern) {
    stopDrag();
    setPattern(next);
    setLevels([...LOCKS[next].start]);
    setOpen(false);
    setFailed(false);
    setSelectedPin(0);
  }
  const feedback = open
    ? "Unlocked. The bolt and lower pins have slid clear. Relock to adjust the pins again."
    : failed
      ? `Jammed. ${state.blockers.length === 1 ? "Pin" : "Pins"} ${state.blockers.join(", ")} ${state.blockers.length === 1 ? "blocks" : "block"} the shear line. Adjust the highlighted pins, then try again.`
      : state.canOpen
        ? "All five joins meet the shear line. Pull the bolt to open the lock."
        : `${state.matched} of 5 pins aligned. Move each brass pin until its join meets the marked line.`;

  return (
    <div className={`pin-lock ${dragging ? "is-dragging" : ""}`}>
      <header className="lock-heading">
        <div>
          <span className="play-kicker">
            07 / ANATOMY · A MECHANICAL PUZZLE
          </span>
          <h3 id="lock-title">
            Small moves.
            <br />
            <em>Big unlock.</em>
          </h3>
          <p>
            Five pins are holding one bolt. Drag the brass pins or use the
            controls. Line up every join, then pull.
          </p>
        </div>
        <div
          className="lock-progress"
          aria-label={`${state.matched} of 5 pins aligned`}
        >
          <span>{open ? "OPEN" : `${state.matched} / 5`}</span>
          <span>{open ? "You found the cut." : "joins on the shear line"}</span>
        </div>
      </header>
      <div className="lock-patterns" role="group" aria-label="Choose a lock">
        {LOCKS.map((lock, index) => (
          <button
            key={lock.name}
            aria-pressed={pattern === index}
            onClick={() => {
              if (index !== pattern) reset(index);
            }}
          >
            {lock.name}
          </button>
        ))}
      </div>
      <div className="lock-layout">
        <div className="lock-figure" ref={scene}>
          <div className="lock-figure-label">
            <span>FIG. 07</span>
            <span>PIN & BOLT / CUTAWAY</span>
          </div>
          <div
            className="lock-stage"
            role="img"
            aria-label={`Cutaway lock: ${state.matched} of 5 pin joins aligned. Bolt ${open ? "open" : "closed"}. Cover lifted ${cover} percent.`}
          >
            <svg
              ref={svg}
              viewBox="0 0 800 480"
              aria-hidden="true"
              focusable="false"
              onPointerMove={moveDrag}
              onPointerUp={(event) => {
                if (drag.current?.id === event.pointerId) stopDrag();
              }}
              onPointerCancel={(event) => {
                if (drag.current?.id === event.pointerId) stopDrag();
              }}
              onLostPointerCapture={(event) => {
                if (drag.current?.id === event.pointerId) stopDrag();
              }}
            >
              {fixed.floor}
              {fixed.housing}
              {art.xs.map((x, index) => (
                <g
                  key={index}
                  className="lock-upper"
                  data-pin={index + 1}
                  style={{
                    transform: shift(
                      x,
                      0,
                      78 + (levels[index] - LOCKS[pattern].cuts[index]) * 8,
                    ),
                  }}
                >
                  {fixed.upper}
                </g>
              ))}
              {art.xs.map((_, index) => (
                <path
                  key={index}
                  className="iso-line lock-spring"
                  d={art.springs[pattern][index][levels[index]]}
                />
              ))}
              {fixed.beam}
              <g key={attempt} className={failed ? "lock-jam" : ""}>
                <g
                  className="lock-bolt"
                  data-part="bolt"
                  data-open={open}
                  style={{ transform: shift(open ? 80 : 0, 0, 0) }}
                >
                  {fixed.bolt}
                  {art.xs.map((x, index) => (
                    <g
                      key={index}
                      className="lock-lifter"
                      style={{ transform: shift(x, 0, 0) }}
                    >
                      {lifters[levels[index]]}
                    </g>
                  ))}
                  {art.xs.map((x, index) => (
                    <g
                      key={index}
                      data-part={`pin-${index + 1}`}
                      data-level={levels[index]}
                      data-selected={selectedPin === index}
                      data-alignment={state.pins[index]}
                      className={`lock-lower ${failed && state.pins[index] !== "aligned" ? "is-blocking" : ""}`}
                      style={{ transform: shift(x, 0, levels[index] * 8) }}
                      onPointerDown={(event) => startDrag(event, index)}
                    >
                      {lower[pattern][index]}
                      <path
                        className="lock-pin-hit"
                        d={lowerHit[pattern][index]}
                      />
                    </g>
                  ))}
                </g>
              </g>
              <path className="iso-line lock-shear" d={art.shear} />
              {fixed.shearEnds}
              <g
                className="lock-cover"
                data-part="cover"
                style={{ transform: shift(0, 0, cover * 0.42) }}
              >
                {fixed.cover}
              </g>
              {fixed.front}
            </svg>
          </div>
          <div className="lock-legend">
            <span>
              <i className="lock-legend-line" />
              Shear line
            </span>
            <span>Brass moves · steel follows</span>
          </div>
          <label className="lock-cover-control">
            Lift the cover <output>{cover}%</output>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={cover}
              onChange={(event) => setCover(Number(event.target.value))}
              aria-label="Lift the cover"
            />
          </label>
        </div>
        <div
          className="lock-pin-controls"
          role="group"
          aria-label="Pin heights"
        >
          <div
            className="lock-pin-chooser"
            role="group"
            aria-label="Choose a pin"
          >
            {levels.map((_, index) => (
              <button
                key={index}
                aria-pressed={selectedPin === index}
                onClick={() => setSelectedPin(index)}
              >
                Pin {index + 1}
              </button>
            ))}
          </div>
          {levels.map((level, index) => (
            <div
              className={`lock-control ${state.pins[index] === "aligned" ? "is-aligned" : ""} ${selectedPin === index ? "is-selected" : ""}`}
              key={index}
            >
              <label htmlFor={`lock-pin-${index}`}>
                <strong>Pin {index + 1}</strong>
                <span>
                  {state.pins[index] === "aligned"
                    ? "Aligned"
                    : state.pins[index] === "low"
                      ? "Too low ↑"
                      : "Too high ↓"}
                </span>
              </label>
              <div className="lock-stepper">
                <button
                  aria-label={`Lower pin ${index + 1}`}
                  disabled={open || level === 0}
                  onClick={() => adjust(index, level - 1)}
                >
                  −
                </button>
                <input
                  id={`lock-pin-${index}`}
                  type="range"
                  min="0"
                  max={PIN_MAX}
                  step="1"
                  value={level}
                  disabled={open}
                  aria-label={`Pin ${index + 1} height`}
                  aria-valuetext={`Level ${level}, ${state.pins[index]}`}
                  onChange={(event) =>
                    adjust(index, Number(event.target.value))
                  }
                />
                <button
                  aria-label={`Raise pin ${index + 1}`}
                  disabled={open || level === PIN_MAX}
                  onClick={() => adjust(index, level + 1)}
                >
                  +
                </button>
                <output htmlFor={`lock-pin-${index}`}>{level}</output>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lock-actions">
        <button
          className="lock-pull"
          onClick={() => {
            stopDrag();
            if (open) {
              setOpen(false);
              setFailed(false);
            } else if (state.canOpen) {
              setOpen(true);
              setFailed(false);
            } else {
              setFailed(true);
              setAttempt((value) => value + 1);
            }
          }}
        >
          {open ? "Relock the bolt" : "Pull the bolt →"}
        </button>
        <button onClick={() => reset()}>Reset pins</button>
      </div>
      <p
        className={`lock-feedback ${failed ? "is-blocked" : ""}`}
        role="status"
        aria-atomic="true"
      >
        {feedback}
      </p>
      <p className="lock-disclaimer">
        A cutaway mechanical puzzle, not a real security device. No timer. No
        hidden score.
      </p>
    </div>
  );
}
