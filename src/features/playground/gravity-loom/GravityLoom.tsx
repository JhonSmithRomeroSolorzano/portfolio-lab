import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  MAX_ATTRACTORS,
  addLoomAttractor,
  defaultAttractors,
  loomPlacements,
  loomPreview,
  moveLoomAttractor,
  type LoomFlow,
  type LoomPoint,
} from "../../../domain/playground/gravity-loom";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import {
  REDUCED_MOTION,
  usePlaybackInterruption,
} from "../../../shared/hooks/usePlaybackInterruption";
import { createLoomRenderer } from "./renderer";

const activeHashes = ["#gravity-loom", "#lab"];

export function GravityLoom() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const renderer = useRef<ReturnType<typeof createLoomRenderer>>(undefined);
  const liveAttractors = useRef<readonly LoomPoint[]>(defaultAttractors);
  const gesture = useRef<{ pointerId: number; index: number } | undefined>(
    undefined,
  );
  const [selected, setSelected] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [attractors, setAttractors] =
    useState<readonly LoomPoint[]>(defaultAttractors);
  const [flow, setFlow] = useState<LoomFlow>("orbit");
  const [strength, setStrength] = useState(100);
  const [placement, setPlacement] = useState("0");
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const [feedback, setFeedback] = useState(
    "Grab a glowing point and drag. The threads follow your pull.",
  );
  const reduced = useMediaQuery(REDUCED_MOTION);
  const stop = useCallback(() => {
    const pointer = gesture.current?.pointerId;
    gesture.current = undefined;
    if (pointer !== undefined && stage.current?.hasPointerCapture(pointer))
      stage.current.releasePointerCapture(pointer);
    setAttractors(liveAttractors.current);
    renderer.current?.release();
    renderer.current?.pause();
    setDragging(false);
    setPlaying(false);
    setFeedback("Playback stopped. The field is still.");
  }, []);
  usePlaybackInterruption(stop, { target: stage, activeHashes });
  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = createLoomRenderer(canvas.current);
    setAvailable(Boolean(renderer.current));
    return () => {
      renderer.current?.dispose();
      renderer.current = undefined;
    };
  }, []);
  useEffect(() => {
    liveAttractors.current = attractors;
    renderer.current?.configure(attractors, flow, strength / 100, reduced);
  }, [attractors, flow, strength, reduced]);
  useEffect(() => {
    renderer.current?.select(selected);
  }, [selected]);
  const staticTrails = useMemo(
    () => (available ? [] : loomPreview(attractors, flow, strength / 100, 36)),
    [available, attractors, flow, strength],
  );

  function add(point: LoomPoint) {
    if (attractors.length >= MAX_ATTRACTORS) {
      setFeedback(
        "Four attractors is the limit. Remove the last one to place another.",
      );
      return;
    }
    const next = addLoomAttractor(liveAttractors.current, point);
    liveAttractors.current = next;
    setAttractors(next);
    setSelected(next.length - 1);
    setFeedback(
      `Attractor ${attractors.length + 1} added. The field has ${attractors.length + 1} attractors.`,
    );
  }

  function begin() {
    if (reduced || !available) return;
    renderer.current?.play();
    setPlaying(true);
  }

  function pointerPosition(event: PointerEvent<HTMLDivElement>): LoomPoint {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = Math.max(1, Math.min(box.width, box.height) * 0.38);
    return {
      x: (event.clientX - box.left - box.width / 2) / scale,
      y: (event.clientY - box.top - box.height / 2) / scale,
    };
  }

  function move(index: number, point: LoomPoint, commit: boolean) {
    const next = moveLoomAttractor(liveAttractors.current, index, point);
    liveAttractors.current = next;
    renderer.current?.move(next, reduced);
    // Keep high-frequency dragging out of React's control tree. Commit on release;
    // the canvas-free fallback instead needs a new static SVG for each input.
    if (commit || !available) setAttractors(next);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const index = gesture.current.index;
    gesture.current = undefined;
    renderer.current?.release();
    setAttractors(liveAttractors.current);
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setFeedback(`Point ${index + 1} moved. Drag again to steer the threads.`);
  }

  function nudge(dx: number, dy: number) {
    const point = liveAttractors.current[selected];
    if (!point) return;
    move(selected, { x: point.x + dx, y: point.y + dy }, true);
    renderer.current?.nudge(selected);
    begin();
    setFeedback(
      `Point ${selected + 1} moved. The existing threads follow its new position.`,
    );
  }
  return (
    <div className="loom-experience">
      <header className="loom-header">
        <div>
          <span className="play-kicker">06 / KINETIC ART</span>
          <h3 id="loom-title">
            Gravity Loom<span>.</span>
          </h3>
        </div>
        <p>
          Grab a glowing point. Pull it around. You’re moving the current—not
          just watching it.
        </p>
      </header>
      <div
        className="loom-stage"
        ref={stage}
        data-playing={playing && !reduced}
        data-flow={flow}
        data-dragging={dragging}
        tabIndex={0}
        role="group"
        aria-label="Interactive gravity field"
        aria-describedby="loom-instructions"
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary || gesture.current) return;
          const point = pointerPosition(event);
          let points = liveAttractors.current;
          if (points.length === 0) {
            points = addLoomAttractor([], point);
            liveAttractors.current = points;
            setAttractors(points);
          }
          const box = event.currentTarget.getBoundingClientRect();
          const scale = Math.max(1, Math.min(box.width, box.height) * 0.38);
          let index = Math.min(selected, points.length - 1);
          let distance = 32 / scale;
          points.forEach((p, i) => {
            const d = Math.hypot(p.x - point.x, p.y - point.y);
            if (d < distance) {
              index = i;
              distance = d;
            }
          });
          gesture.current = { pointerId: event.pointerId, index };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          setSelected(index);
          renderer.current?.select(index);
          setDragging(true);
          move(index, point, false);
          if (!reduced) renderer.current?.grab(index);
          begin();
          setFeedback(
            `Pulling point ${index + 1}. Move your hand to bend the threads.`,
          );
        }}
        onPointerMove={(event) => {
          if (gesture.current?.pointerId === event.pointerId)
            move(gesture.current.index, pointerPosition(event), false);
        }}
        onPointerUp={finish}
        onLostPointerCapture={finish}
        onPointerCancel={() => stop()}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const directions: Record<string, [number, number]> = {
            ArrowLeft: [-0.08, 0],
            ArrowRight: [0.08, 0],
            ArrowUp: [0, -0.08],
            ArrowDown: [0, 0.08],
          };
          if (directions[event.key]) {
            event.preventDefault();
            nudge(...directions[event.key]);
          } else if (event.key === "Escape") {
            event.preventDefault();
            stop();
          } else if (event.key === " ") {
            event.preventDefault();
            if (playing) stop();
            else begin();
          }
        }}
      >
        <span className="loom-stage-label" aria-hidden="true">
          JSR / THREADS OF LIGHT
        </span>
        <canvas ref={canvas} aria-hidden="true" hidden={!available} />
        {!available && (
          <svg viewBox="-1.3 -1.3 2.6 2.6" aria-hidden="true">
            {staticTrails.map((trail, i) => (
              <polyline
                key={i}
                points={trail.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.005"
              />
            ))}
            {attractors.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="0.035"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.006"
              />
            ))}
          </svg>
        )}
        <span className="loom-stage-caption" aria-hidden="true">
          {attractors.length} ATTRACTORS /{" "}
          {dragging
            ? "FOLLOWING YOUR HAND"
            : playing && !reduced
              ? "WEAVING"
              : "DRAG A POINT TO BEGIN"}
        </span>
      </div>
      <div className="loom-controls">
        <div role="group" aria-label="Flow pattern" className="loom-actions">
          {(["orbit", "weave"] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={mode === flow}
              onClick={() => {
                if (mode === flow) return;
                setFlow(mode);
                setFeedback(
                  `${mode === "orbit" ? "Orbit" : "Weave"} flow selected. Your existing threads are preserved.`,
                );
              }}
            >
              {mode === "orbit" ? "Orbit" : "Weave"}
            </button>
          ))}
        </div>
        <div className="loom-actions">
          <button
            disabled={reduced || !available}
            onClick={() => {
              if (playing) {
                stop();
                setFeedback("Paused. Your woven trails stay in place.");
              } else {
                begin();
                setFeedback("Weaving light. Drag a point to pull the threads.");
              }
            }}
          >
            {playing && !reduced ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              stop();
              setAttractors([...defaultAttractors]);
              liveAttractors.current = defaultAttractors;
              renderer.current?.reset(defaultAttractors, "orbit", 1);
              setSelected(0);
              setFlow("orbit");
              setStrength(100);
              setPlacement("0");
              setFeedback("Reset to two attractors and Orbit flow.");
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div className="loom-settings">
        <label className="loom-strength">
          Flow strength <output aria-hidden="true">{strength}%</output>
          <input
            aria-label="Flow strength"
            aria-valuetext={`${strength}%`}
            type="range"
            min="50"
            max="150"
            step="10"
            value={strength}
            onChange={(event) => {
              setStrength(Number(event.target.value));
              setFeedback(
                "Flow strength changed without restarting the threads.",
              );
            }}
          />
        </label>
        <div className="loom-placement">
          <label htmlFor="loom-placement">Attractor placement</label>
          <select
            id="loom-placement"
            value={placement}
            onChange={(event) => setPlacement(event.target.value)}
          >
            {loomPlacements.map((point, i) => (
              <option key={point.label} value={i}>
                {point.label}
              </option>
            ))}
          </select>
          <div className="loom-actions">
            <button
              disabled={!attractors.length}
              onClick={() => {
                move(selected, loomPlacements[Number(placement)], true);
                renderer.current?.nudge(selected);
                begin();
                setFeedback(
                  `Point ${selected + 1} moved to ${loomPlacements[Number(placement)].label.toLowerCase()}.`,
                );
              }}
            >
              Move here
            </button>
            <button
              disabled={attractors.length >= MAX_ATTRACTORS}
              onClick={() => add(loomPlacements[Number(placement)])}
            >
              Add attractor
            </button>
            <button
              disabled={attractors.length === 0}
              onClick={() => {
                const next = liveAttractors.current.slice(0, -1);
                liveAttractors.current = next;
                setAttractors(next);
                setSelected(Math.min(selected, Math.max(0, next.length - 1)));
                setFeedback(
                  `Last attractor removed. ${attractors.length - 1} remain.`,
                );
              }}
            >
              Remove last
            </button>
          </div>
        </div>
      </div>
      <details className="loom-fine-controls">
        <summary>Move a point without dragging</summary>
        <div
          role="group"
          aria-label="Controlled attractor"
          className="loom-actions"
        >
          {attractors.map((_, index) => (
            <button
              key={index}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              Point {index + 1}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Move selected attractor"
          className="loom-actions"
        >
          <button disabled={!attractors.length} onClick={() => nudge(-0.1, 0)}>
            Move left
          </button>
          <button disabled={!attractors.length} onClick={() => nudge(0.1, 0)}>
            Move right
          </button>
          <button disabled={!attractors.length} onClick={() => nudge(0, -0.1)}>
            Move up
          </button>
          <button disabled={!attractors.length} onClick={() => nudge(0, 0.1)}>
            Move down
          </button>
        </div>
        <p>
          {attractors[selected]
            ? `Point ${selected + 1}: horizontal ${Math.round(attractors[selected].x * 100)}%, vertical ${Math.round(attractors[selected].y * 100)}%.`
            : "Add a point to begin."}
        </p>
      </details>
      <p className="loom-status" role="status" aria-atomic="true">
        {reduced
          ? `Static ${flow} artwork with ${attractors.length} attractors. Reduced motion is enabled. ${feedback}`
          : !available
            ? `Static ${flow} artwork with ${attractors.length} attractors. Canvas is unavailable. ${feedback}`
            : feedback}
      </p>
      <p className="loom-note" id="loom-instructions">
        Drag a glowing point with your mouse or finger to pull the existing
        threads. Drag empty space to move your selected point. Focus the field
        and use arrow keys to steer, Space to play/pause, or Escape to stop.
        Named positions, Move here, and the fine controls also work without
        dragging. Scroll outside the field to move the page. This is kinetic
        art, not orbital physics.
      </p>
    </div>
  );
}
