import { CURVES } from "./curves";
import { useMotionPlayback } from "./useMotionPlayback";

export function MotionStudio() {
  const {
    curve,
    duration,
    playing,
    arrived,
    reduced,
    runner,
    baseline,
    chooseCurve,
    chooseDuration,
    play,
  } = useMotionPlayback();

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
                onClick={() => chooseCurve(i)}
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
              onChange={(e) => chooseDuration(Number(e.target.value))}
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
