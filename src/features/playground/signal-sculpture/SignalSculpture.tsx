import { useEffect, useRef, useState } from "react";
import {
  sculptureForms,
  sculpturePoints,
  type SculptureForm,
} from "../../../domain/playground/signal-sculpture";
import { useViewportPlayback } from "../../../shared/hooks/useViewportPlayback";
import { createSculptureRenderer } from "./renderer";

const labels = { monogram: "Monogram", ribbon: "Ribbon", orbit: "Orbit" };

export function SignalSculpture() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer =
    useRef<ReturnType<typeof createSculptureRenderer>>(undefined);
  const [form, setForm] = useState<SculptureForm>("monogram");
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState(
    "Monogram in motion. Choose another form or send a pulse.",
  );
  const { playing, reduced, play, pause } = useViewportPlayback(
    stage,
    available,
  );
  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = createSculptureRenderer(canvas.current);
    setAvailable(Boolean(renderer.current));
    return () => {
      renderer.current?.dispose();
      renderer.current = undefined;
    };
  }, []);
  useEffect(() => {
    if (playing) renderer.current?.play();
    else renderer.current?.pause();
  }, [playing]);
  useEffect(() => {
    if (reduced) renderer.current?.settle();
  }, [reduced]);

  function select(next: SculptureForm) {
    if (next === form) return;
    setForm(next);
    renderer.current?.setForm(next, reduced || !playing);
    setMessage(`${labels[next]} selected. Particles are transforming.`);
  }
  return (
    <div className="sculpture-experience">
      <header className="sculpture-header">
        <div>
          <span className="play-kicker">03 / GENERATIVE ART</span>
          <h3 id="sculpture-title">
            Signal Sculpture<span>.</span>
          </h3>
        </div>
        <p>
          A thousand small signals. One living form. Turn letters into a ribbon,
          then let them orbit.
        </p>
      </header>
      <div
        className="sculpture-stage"
        ref={stage}
        data-playing={playing && !reduced}
        data-form={form}
        onPointerMove={(event) => {
          if (!playing || reduced || event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          renderer.current?.pointer(
            (event.clientX - box.left) / box.width - 0.5,
            (event.clientY - box.top) / box.height - 0.5,
          );
        }}
        onPointerLeave={() => renderer.current?.pointer(0, 0)}
      >
        <span className="sculpture-stage-label" aria-hidden="true">
          JSR / FIELD STUDIES
        </span>
        <canvas ref={canvas} aria-hidden="true" hidden={!available} />
        {!available && (
          <svg viewBox="-1 -0.65 2 1.3" aria-hidden="true">
            {sculpturePoints(form, 360).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.008" fill="currentColor" />
            ))}
          </svg>
        )}
        <span className="sculpture-stage-caption" aria-hidden="true">
          {labels[form]} / {playing && !reduced ? "IN MOTION" : "STILL"}
        </span>
      </div>
      <div className="sculpture-controls">
        <div
          role="group"
          aria-label="Sculpture form"
          className="sculpture-forms"
        >
          {sculptureForms.map((value) => (
            <button
              key={value}
              aria-pressed={form === value}
              onClick={() => select(value)}
            >
              {labels[value]}
            </button>
          ))}
        </div>
        <div className="sculpture-playback">
          <button
            disabled={reduced || !available}
            onClick={() => {
              if (playing) pause();
              else {
                play();
                setMessage(
                  `${labels[form]} in motion. Choose another form or send a pulse.`,
                );
              }
            }}
          >
            {playing && !reduced ? "Pause" : "Play"}
          </button>
          <button
            disabled={!playing || reduced || !available}
            onClick={() => {
              renderer.current?.pulse();
              setMessage(`Pulse sent through ${labels[form].toLowerCase()}.`);
            }}
          >
            Pulse
          </button>
          <button
            onClick={() => {
              pause();
              renderer.current?.reset();
              renderer.current?.setForm("monogram", true);
              setForm("monogram");
              setMessage("Reset to the still JSR monogram.");
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <p className="sculpture-status" role="status" aria-atomic="true">
        {reduced
          ? `${labels[form]} displayed without animation. Reduced motion is enabled.`
          : !available
            ? `${labels[form]} shown as a static illustration. Canvas is unavailable.`
            : playing
              ? message
              : `${labels[form]} is still. Press Play to animate.`}
      </p>
      <p className="sculpture-note">
        Starts when it comes into view. Pause anytime. Choose a form while
        playing to watch it dissolve and reassemble. Pulse sends a wave through
        the points. Mouse movement gently changes the perspective; all actions
        work with buttons, touch, and keyboard.
      </p>
    </div>
  );
}
