import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  airPoint,
  enginePower,
  engineSpeed,
} from "../../../domain/playground/jet-engine";
import { useViewportPlayback } from "../../../shared/hooks/useViewportPlayback";
import { createEngineRenderer } from "./renderer";
import { engineFaces, project, svgPath } from "./mesh";
import backLight from "./engine-back-light.svg";
import backDark from "./engine-back-dark.svg";
import frontLight from "./engine-front-light.svg";
import frontDark from "./engine-front-dark.svg";

const PRESETS = [
  { name: "Idle", value: 25 },
  { name: "Cruise", value: 60 },
  { name: "Full power", value: 100 },
];
function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
const themeSnapshot = () => document.documentElement.dataset.theme === "dark";
const staticFaces = engineFaces(0);

export function JetEngine() {
  const [speed, setSpeed] = useState(35);
  const [available, setAvailable] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const dark = useSyncExternalStore(subscribeTheme, themeSnapshot, () => false);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createEngineRenderer>>(undefined);
  const power = enginePower(speed);
  const {
    playing: running,
    reduced,
    play,
    pause,
  } = useViewportPlayback(stage, available && speed > 0 && !artFailed);
  useEffect(() => {
    if (!canvas.current) return;
    const view = createEngineRenderer(canvas.current, () => {
      setAvailable(false);
    });
    renderer.current = view;
    setAvailable(!!view);
    return () => {
      view?.dispose();
      renderer.current = undefined;
    };
  }, []);
  useEffect(() => {
    renderer.current?.configure(speed, reduced);
  }, [speed, reduced]);
  useEffect(() => {
    if (running) renderer.current?.play();
    else renderer.current?.pause();
  }, [running]);
  function chooseSpeed(value: number) {
    const next = engineSpeed(value);
    if (next === speed) return;
    setSpeed(next);
    if (next > 0) play();
    else pause();
  }
  function reset() {
    pause();
    setSpeed(35);
    renderer.current?.reset(35);
  }
  const fallbackRoutes = Array.from(
    { length: speed === 0 ? 0 : Math.round(8 + speed * 0.2) },
    (_, route) => {
      const points = Array.from({ length: 45 }, (_, i) =>
        airPoint(route, i / 44, power),
      );
      return {
        route,
        cool: svgPath(
          points.filter((p) => route % 3 !== 0 || p[0] <= -8).map(project),
        ),
        hot:
          route % 3 === 0
            ? svgPath(points.filter((p) => p[0] >= -20).map(project))
            : "",
      };
    },
  );
  return (
    <div className="jet-engine" data-playing={running}>
      <header className="engine-heading">
        <div>
          <span className="play-kicker">01 / ANATOMY · AIR IN MOTION</span>
          <h3 id="engine-title">Inside a jet engine.</h3>
          <p>
            Adjust the <strong>engine speed slider</strong>. Watch the fan spin
            faster, air rush through the core, and the exhaust stream grow.
          </p>
        </div>
        <div className="engine-setting">
          <strong>
            {speed}
            <small>%</small>
          </strong>
          <span>engine speed setting</span>
        </div>
      </header>
      <div className="engine-legend">
        <span>
          <i className="engine-cool-key" />
          Cool intake & bypass air
        </span>
        <span>
          <i className="engine-hot-key" />
          Heated core air
        </span>
      </div>
      <div
        className="engine-stage"
        ref={stage}
        role="img"
        aria-label={`Cutaway aircraft turbofan at ${speed} percent speed. ${running ? "Fan, core rotors and airflow are moving." : "Still engine and airflow view."}`}
      >
        <img
          className="engine-rear"
          width="1100"
          height="480"
          src={dark ? backDark : backLight}
          alt=""
          draggable="false"
          onError={() => {
            setArtFailed(true);
          }}
        />
        <svg
          className="engine-fallback engine-layer"
          viewBox="0 0 1100 480"
          aria-hidden="true"
          style={{ visibility: available ? "hidden" : "visible" }}
        >
          {fallbackRoutes.map(({ route, cool, hot }) => (
            <g key={route}>
              <path className="fallback-cool" d={cool} />
              <path className="fallback-hot" d={hot} />
            </g>
          ))}
          {staticFaces.map((face, index) => (
            <path
              key={index}
              className="engine-blade"
              data-shade={face.shade}
              d={svgPath(face.points) + "Z"}
            />
          ))}
        </svg>
        <canvas
          className="engine-layer engine-canvas"
          ref={canvas}
          aria-hidden="true"
          style={{ visibility: available ? "visible" : "hidden" }}
        />
        <img
          className="engine-layer engine-front"
          width="1100"
          height="480"
          src={dark ? frontDark : frontLight}
          alt=""
          draggable="false"
          onError={() => {
            setArtFailed(true);
          }}
        />
      </div>
      <div className="engine-view-caption" aria-hidden="true">
        <span>ENGINE CUTAWAY</span>
        <span>
          {running
            ? "AIRFLOW LIVE"
            : reduced
              ? "REDUCED-MOTION STILL"
              : "AIRFLOW PAUSED"}
        </span>
      </div>
      <div className="engine-control-panel">
        <div className="engine-speed-label">
          <label htmlFor="engine-speed">Engine speed</label>
          <output htmlFor="engine-speed">{speed}%</output>
        </div>
        <input
          id="engine-speed"
          type="range"
          min="0"
          max="100"
          step="1"
          value={speed}
          onChange={(event) => chooseSpeed(Number(event.target.value))}
          aria-describedby="engine-speed-help"
        />
        <div className="engine-range-labels" aria-hidden="true">
          <span>OFF</span>
          <span>FULL POWER</span>
        </div>
        <p id="engine-speed-help">
          Motion starts when the engine comes into view. Pause anytime. Blue air
          flows around the core; orange air passes through the heated core.
        </p>
        <div className="engine-toolbar">
          <div
            className="engine-presets"
            role="group"
            aria-label="Engine speed presets"
          >
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                aria-pressed={speed === preset.value}
                onClick={() => chooseSpeed(preset.value)}
              >
                {preset.name}
                <span>{preset.value}%</span>
              </button>
            ))}
          </div>
          <div className="engine-playback">
            <button
              className="engine-play"
              disabled={!available || reduced || artFailed}
              onClick={() => {
                if (running) pause();
                else {
                  if (speed === 0) setSpeed(35);
                  play();
                }
              }}
            >
              {running
                ? "Pause engine"
                : speed === 0
                  ? "Start engine"
                  : "Play engine"}
            </button>
            <button onClick={reset}>Reset</button>
          </div>
        </div>
      </div>
      {artFailed && (
        <p className="engine-art-error" role="alert">
          The engine casing artwork couldn’t load.{" "}
          <button onClick={() => window.location.reload()}>Reload page</button>
        </p>
      )}
      <ol className="engine-stages">
        <li>
          <strong>1 · Intake</strong>
          <span>
            The fan draws air in and sends most illustrated streams around the
            core.
          </span>
        </li>
        <li>
          <strong>2 · Compress</strong>
          <span>
            Smaller blade rows guide the core stream toward the combustor.
          </span>
        </li>
        <li>
          <strong>3 · Heat</strong>
          <span>
            Orange tracers mark heated core air passing through the turbine.
          </span>
        </li>
        <li>
          <strong>4 · Exhaust</strong>
          <span>The core and bypass streams meet behind the engine.</span>
        </li>
      </ol>
      <p className="engine-feedback" role="status" aria-atomic="true">
        {speed === 0
          ? "Engine off. Increase engine speed to start the airflow."
          : reduced
            ? `Static view at ${speed}%. Reduced motion is on; speed still changes the airflow density and exhaust reach.`
            : !available
              ? `Static SVG view at ${speed}%. Canvas animation is unavailable; the speed control still updates the air paths.`
              : running
                ? `Running at a ${speed}% setting. Higher speed means faster blades, faster and denser air trails, and a longer exhaust stream.`
                : `Paused at ${speed}%. Play the engine or change its speed to see the airflow.`}
      </p>
      <p className="engine-disclaimer">
        Illustrative turbofan cutaway. Rotation is slowed; colors reveal air
        routes and heating. Not real engine data or a thermodynamic simulation.
      </p>
    </div>
  );
}
