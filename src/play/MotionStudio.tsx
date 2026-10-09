import { useEffect, useRef, useState } from "react";

const CURVES = [
  {
    name: "Steady",
    easing: "linear",
    path: "M0 100 L100 0",
    note: "The same speed, from start to finish.",
  },
  {
    name: "Soft landing",
    easing: "cubic-bezier(.16,1,.3,1)",
    path: "M0 100 C16 0 30 0 100 0",
    note: "A quick departure with a gentle arrival.",
  },
  {
    name: "Slow & smooth",
    easing: "cubic-bezier(.65,0,.35,1)",
    path: "M0 100 C65 100 35 0 100 0",
    note: "Ease into the movement, then ease back out.",
  },
  {
    name: "A little bounce",
    easing: "cubic-bezier(.34,1.56,.64,1)",
    path: "M0 100 C34 -56 64 0 100 0",
    note: "Go a little past the destination, then settle.",
  },
];

export function MotionStudio() {
  const [curve, setCurve] = useState(1);
  const [duration, setDuration] = useState(1100);
  const [playing, setPlaying] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const runner = useRef<HTMLDivElement>(null);
  const baseline = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  function cancel() {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    setPlaying(false);
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(media.matches);
      cancel();
      setArrived(false);
    };
    const visibility = () => {
      if (document.hidden) {
        cancel();
        setArrived(false);
      }
    };
    media.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
      animations.current.forEach((animation) => animation.cancel());
    };
  }, []);
  useEffect(() => {
    cancel();
    setArrived(false);
  }, [curve, duration]);
  function play() {
    cancel();
    setArrived(false);
    const nodes = [runner.current, baseline.current];
    if (reduced || nodes.some((node) => !node?.animate)) {
      setArrived(true);
      return;
    }
    const current = nodes.map((node, index) =>
      node!.animate(
        [
          { left: "0%", transform: "rotate(0deg)" },
          { left: "calc(100% - 44px)", transform: "rotate(180deg)" },
        ],
        {
          duration,
          easing: index === 0 ? CURVES[curve].easing : "linear",
          fill: "forwards",
        },
      ),
    );
    // Both lanes share the same document clock, distance, and duration.
    const start = document.timeline.currentTime;
    if (typeof start === "number")
      current.forEach((animation) => {
        animation.startTime = start;
      });
    animations.current = current;
    setPlaying(true);
    Promise.all(current.map((animation) => animation.finished)).then(
      () => {
        if (animations.current === current) {
          setArrived(true);
          setPlaying(false);
          current.forEach((animation) => animation.cancel());
          animations.current = [];
        }
      },
      () => {},
    );
  }

  return (
    <div className="motion-studio">
      <div className="motion-intro">
        <span className="play-kicker">03 / FEEL THE DIFFERENCE</span>
        <h3 id="motion-title">
          Same journey.
          <br />
          <em>Different feeling.</em>
        </h3>
        <p>
          Pick a curve and watch it beside a steady reference. Same distance,
          same duration. Only the feeling changes.
        </p>
      </div>
      <div className="motion-workspace">
        <div className="motion-stage">
          <div className="motion-stage-label">
            <span>START</span>
            <span>ARRIVE</span>
          </div>
          {[
            { name: CURVES[curve].name, label: "YOUR CURVE", ref: runner },
            { name: "Steady", label: "REFERENCE", ref: baseline },
          ].map((lane, index) => (
            <div
              className={`motion-lane ${index === 1 ? "is-reference" : ""}`}
              key={index}
            >
              <div className="motion-lane-label">
                <strong>{lane.name}</strong>
                <span>{lane.label}</span>
              </div>
              <div className="motion-track">
                <div
                  ref={lane.ref}
                  className={`motion-runner ${arrived ? "has-arrived" : ""}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
              </div>
            </div>
          ))}
          <div className="motion-curve-note">
            <svg viewBox="-5 -30 110 140" aria-hidden="true">
              <path className="curve-guide" d="M0 0V100H100" />
              <path className="curve-reference" d={CURVES[0].path} />
              <path d={CURVES[curve].path} />
            </svg>
            <div>
              <strong>{CURVES[curve].name}</strong>
              <p>{CURVES[curve].note}</p>
            </div>
          </div>
        </div>
        <div className="motion-controls">
          <div
            className="motion-options"
            role="group"
            aria-label="Animation curve"
          >
            {CURVES.map((option, i) => (
              <button
                key={option.name}
                aria-pressed={i === curve}
                onClick={() => setCurve(i)}
              >
                {option.name}
              </button>
            ))}
          </div>
          <label className="motion-duration" htmlFor="motion-duration">
            Duration <span>{(duration / 1000).toFixed(1)} s</span>
            <input
              id="motion-duration"
              type="range"
              min="600"
              max="1800"
              step="100"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          <button className="motion-play" onClick={play}>
            {reduced
              ? "Show end state"
              : playing
                ? "Replay motion ↗"
                : "Play motion ↗"}
          </button>
          <p className="motion-feedback" role="status">
            {reduced
              ? "Reduced motion is on. Show both end states without animation."
              : playing
                ? "Comparing both curves…"
                : arrived
                  ? "Both arrived together. Try another curve."
                  : "Two paths. One shared duration. Ready when you are."}
          </p>
        </div>
      </div>
    </div>
  );
}
