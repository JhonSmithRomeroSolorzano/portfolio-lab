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
  const animation = useRef<Animation | null>(null);
  function cancel() {
    animation.current?.cancel();
    animation.current = null;
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
      animation.current?.cancel();
    };
  }, []);
  useEffect(() => {
    cancel();
    setArrived(false);
  }, [curve, duration]);
  function play() {
    cancel();
    setArrived(false);
    if (reduced || !runner.current?.animate) {
      setArrived(true);
      return;
    }
    const current = runner.current.animate(
      [
        { left: "0%", transform: "rotate(0deg)" },
        { left: "calc(100% - 44px)", transform: "rotate(180deg)" },
      ],
      { duration, easing: CURVES[curve].easing, fill: "forwards" },
    );
    animation.current = current;
    setPlaying(true);
    current.finished.then(
      () => {
        if (animation.current === current) {
          setArrived(true);
          setPlaying(false);
          current.cancel();
          animation.current = null;
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
          A small change in timing can change an entire interaction. Pick a
          curve, press play, and feel it.
        </p>
      </div>
      <div className="motion-workspace">
        <div className="motion-stage">
          <div className="motion-stage-label">
            <span>START</span>
            <span>ARRIVE</span>
          </div>
          <div className="motion-track">
            <div
              ref={runner}
              className={`motion-runner ${arrived ? "has-arrived" : ""}`}
              aria-hidden="true"
            >
              <span />
            </div>
          </div>
          <div className="motion-curve-note">
            <svg viewBox="-5 -30 110 140" aria-hidden="true">
              <path className="curve-guide" d="M0 0V100H100" />
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
              ? "Reduced motion is on. Previewing the end state without animation."
              : playing
                ? "In motion…"
                : arrived
                  ? "Arrived. Try another feeling."
                  : "Ready when you are."}
          </p>
        </div>
      </div>
    </div>
  );
}
