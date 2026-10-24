import type { ThrustMode } from "../../../domain/playground/jet-engine";

type EngineFeedbackState = Readonly<{
  speed: number;
  mode: ThrustMode;
  available: boolean | undefined;
  artFailed: boolean;
  artReady: boolean;
  reduced: boolean;
  running: boolean;
}>;

/** Presentation policy: loading/failure/off states take priority over playback. */
export function engineFeedback(state: EngineFeedbackState): string {
  const { speed, mode, available, artFailed, artReady, reduced, running } =
    state;
  let message: string;
  if (artFailed) message = "Engine paused until its artwork can be reloaded.";
  else if (!artReady) message = "Loading engine casing artwork…";
  else if (speed === 0)
    message = "Engine off. Increase engine speed to start the airflow.";
  else if (reduced)
    message = `Static view at ${speed}%. Reduced motion is on; speed still changes the airflow density and exhaust reach.`;
  else if (available === undefined) message = "Preparing engine animation…";
  else if (!available)
    message = `Static SVG view at ${speed}%. Canvas animation is unavailable; the speed control still updates the air paths.`;
  else if (running)
    message = `Running at a ${speed}% setting. Higher speed means faster blades, faster and denser air trails, and a longer exhaust stream.`;
  else
    message = `Paused at ${speed}%. Play the engine or change its speed to see the airflow.`;

  const thrust =
    mode === "reverse"
      ? "Reverse thrust selected. Bypass air redirects forward; engine rotation does not reverse."
      : "Forward thrust selected.";
  return `${message} ${thrust}`;
}
