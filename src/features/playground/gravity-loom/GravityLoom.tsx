import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_ATTRACTORS,
  addLoomAttractor,
  defaultAttractors,
  loomPlacements,
  loomPreview,
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
  const [attractors, setAttractors] =
    useState<readonly LoomPoint[]>(defaultAttractors);
  const [flow, setFlow] = useState<LoomFlow>("orbit");
  const [strength, setStrength] = useState(100);
  const [placement, setPlacement] = useState("0");
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const [feedback, setFeedback] = useState(
    "Two attractors ready. Choose a flow or place another pull.",
  );
  const reduced = useMediaQuery(REDUCED_MOTION);
  const stop = useCallback(() => {
    renderer.current?.pause();
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
    renderer.current?.configure(attractors, flow, strength / 100);
  }, [attractors, flow, strength, reduced]);
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
    setAttractors(addLoomAttractor(attractors, point));
    setFeedback(
      `Attractor ${attractors.length + 1} added. The field has ${attractors.length + 1} attractors.`,
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
          Place a pull. Change the current. Watch light weave around the
          invisible.
        </p>
      </header>
      <div
        className="loom-stage"
        ref={stage}
        data-playing={playing && !reduced}
        data-flow={flow}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const scale = Math.min(box.width, box.height) * 0.38;
          add({
            x: (event.clientX - box.left - box.width / 2) / scale,
            y: (event.clientY - box.top - box.height / 2) / scale,
          });
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
          {playing && !reduced ? "WEAVING" : "STILL"}
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
                  `${mode === "orbit" ? "Orbit" : "Weave"} flow selected. The trails start a new pattern.`,
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
                renderer.current?.play();
                setPlaying(true);
                setFeedback(
                  "Weaving light. Add an attractor or change the flow.",
                );
              }
            }}
          >
            {playing && !reduced ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              stop();
              setAttractors([...defaultAttractors]);
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
                "Flow strength changed. The trails start a new pattern.",
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
              disabled={attractors.length >= MAX_ATTRACTORS}
              onClick={() => add(loomPlacements[Number(placement)])}
            >
              Add attractor
            </button>
            <button
              disabled={attractors.length === 0}
              onClick={() => {
                setAttractors(attractors.slice(0, -1));
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
      <p className="loom-status" role="status" aria-atomic="true">
        {reduced
          ? `Static ${flow} artwork with ${attractors.length} attractors. Reduced motion is enabled. ${feedback}`
          : !available
            ? `Static ${flow} artwork with ${attractors.length} attractors. Canvas is unavailable. ${feedback}`
            : feedback}
      </p>
      <p className="loom-note">
        Tap the field to place an attractor, or choose a position and use Add
        attractor. Up to four pulls shape the trails; changing the field starts
        a fresh pattern. This is an artistic attraction-and-swirl model, not a
        physics simulation.
      </p>
    </div>
  );
}
