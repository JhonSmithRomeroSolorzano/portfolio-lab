import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  engineSpeed,
  type ThrustMode,
} from "../../../domain/playground/jet-engine";
import { useViewportPlayback } from "../../../shared/hooks/useViewportPlayback";
import { createEngineRenderer } from "./renderer";
import { stillAir, stillFaces } from "./svg-frame";
import { engineFeedback } from "./feedback";
import backLight from "./engine-back-light.svg";
import backDark from "./engine-back-dark.svg";

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

export function JetEngine() {
  const [speed, setSpeed] = useState(35);
  const [mode, setMode] = useState<ThrustMode>("forward");
  const [available, setAvailable] = useState<boolean | undefined>(undefined);
  const [artFailed, setArtFailed] = useState(false);
  const [loadedArt, setLoadedArt] = useState<string>();
  const dark = useSyncExternalStore(subscribeTheme, themeSnapshot, () => false);
  const artSrc = dark ? backDark : backLight;
  const artReady = loadedArt === artSrc;
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createEngineRenderer>>(undefined);
  const {
    playing: running,
    reduced,
    play,
    pause,
  } = useViewportPlayback(
    stage,
    !!available && artReady && speed > 0 && !artFailed,
  );
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
    renderer.current?.configure(speed, reduced, mode);
  }, [speed, reduced, mode]);
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
    setMode("forward");
    renderer.current?.reset(35);
  }
  const fallbackRoutes =
    available === false && artReady ? stillAir(speed, mode) : [];
  const fallbackFaces = available === false && artReady ? stillFaces(mode) : [];
  return (
    <div className="jet-engine" data-playing={running} data-thrust={mode}>
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
      <div className="engine-thrust-control">
        <button
          type="button"
          aria-pressed={mode === "reverse"}
          aria-describedby="engine-thrust-help"
          onClick={() => setMode(mode === "forward" ? "reverse" : "forward")}
        >
          Reverse thrust{" "}
          <span aria-hidden="true">{mode === "reverse" ? "On" : "Off"}</span>
        </button>
        <div className="engine-thrust-help">
          <p
            id={mode === "forward" ? "engine-thrust-help" : undefined}
            aria-hidden={mode !== "forward"}
          >
            Try the landing reverser: deploy doors to turn bypass air forward,
            not reverse the engine’s rotation.
          </p>
          <p
            id={mode === "reverse" ? "engine-thrust-help" : undefined}
            aria-hidden={mode !== "reverse"}
          >
            Landing illustration: doors redirect blue bypass air forward. The
            fan keeps spinning normally; orange core exhaust still exits
            rearward.
          </p>
        </div>
      </div>
      <div
        className="engine-stage"
        ref={stage}
        role="img"
        aria-label={
          artFailed
            ? "Engine artwork unavailable."
            : !artReady
              ? "Loading the cutaway aircraft engine artwork."
              : `Wing-mounted cutaway aircraft turbofan at ${speed} percent speed. ${mode === "reverse" ? "Reverse thrust selected: bypass air redirects forward; core exhaust and blade rotation retain their normal direction." : "Forward thrust selected."} ${running ? "Fan, core rotors and airflow are moving." : "Still engine and airflow view."}`
        }
      >
        <img
          className="engine-rear"
          width="1100"
          height="480"
          src={artSrc}
          alt=""
          draggable="false"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (
              image.complete &&
              image.naturalWidth > 0 &&
              image.currentSrc === new URL(artSrc, document.baseURI).href
            )
              setLoadedArt(artSrc);
          }}
          onError={() => {
            setArtFailed(true);
          }}
        />
        <svg
          className="engine-fallback engine-layer"
          viewBox="0 0 1100 480"
          aria-hidden="true"
          style={{
            visibility:
              available === false && artReady && !artFailed
                ? "visible"
                : "hidden",
          }}
        >
          {fallbackFaces.map((face, index) => (
            <g key={index}>
              <path
                className="engine-blade"
                data-shade={face.shade}
                d={face.fill}
              />
              <path className="engine-blade-outline" d={face.edges} />
            </g>
          ))}
          {fallbackRoutes.map(({ route, cool, hot }) => (
            <g key={route}>
              <path className="fallback-cool" d={cool} />
              <path className="fallback-hot" d={hot} />
            </g>
          ))}
        </svg>
        <canvas
          className="engine-layer engine-canvas"
          ref={canvas}
          aria-hidden="true"
          style={{
            visibility:
              available && artReady && !artFailed ? "visible" : "hidden",
          }}
        />
      </div>
      <div className="engine-view-caption" aria-hidden="true">
        <span>
          {mode === "reverse"
            ? "REVERSE THRUST · BYPASS FORWARD"
            : "UNDER-WING CUTAWAY"}
        </span>
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
              disabled={!available || !artReady || reduced || artFailed}
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
          <strong>
            {mode === "reverse" ? "4 · Reverse thrust" : "4 · Exhaust"}
          </strong>
          <span>
            {mode === "reverse"
              ? "Blocker flaps redirect bypass air through open doors toward the front; core exhaust continues rearward."
              : "The core and bypass streams meet behind the engine."}
          </span>
        </li>
      </ol>
      <p className="engine-feedback" role="status" aria-atomic="true">
        {engineFeedback({
          speed,
          mode,
          available,
          artFailed,
          artReady,
          reduced,
          running,
        })}
      </p>
      <p className="engine-disclaimer">
        Illustrative under-wing turbofan cutaway. The pylon joins the engine to
        the wing; the open side exposes its internals. Rotation is slowed;
        colors reveal air routes and heating. Not real engine data or a
        thermodynamic simulation. The reverser is a simplified cold-stream
        landing illustration, not a particular aircraft’s mechanism or operating
        procedure.
      </p>
    </div>
  );
}
