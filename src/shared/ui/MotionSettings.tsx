import { useState } from "react";
import { useClientReady } from "../hooks/useClientReady";
import {
  useMotionPreference,
  useReducedMotion,
} from "../hooks/useReducedMotion";
import { setMotionPreference } from "../motion/motion-preference";

export function MotionSettings() {
  const ready = useClientReady();
  const preference = useMotionPreference();
  const reduced = useReducedMotion();
  const [saved, setSaved] = useState(true);
  return (
    <details
      className="motion-settings"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }}
      onBlur={(event) => {
        // WebKit can blur the summary without focusing a mouse-clicked radio.
        // Close on a real focus destination, not before its click can complete.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          event.currentTarget.open = false;
      }}
    >
      <summary aria-label="Motion settings" title="Motion settings">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M3 7h6m6 0h6M3 17h10m6 0h2" />
          <circle cx="12" cy="7" r="3" />
          <circle cx="16" cy="17" r="3" />
        </svg>
        <span>Motion</span>
      </summary>
      <div className="motion-settings-panel">
        <fieldset
          disabled={!ready}
          aria-describedby="motion-preference-status motion-preference-help"
        >
          <legend>Animation preference</legend>
          <label>
            <input
              type="radio"
              name="animation-preference"
              value="system"
              checked={preference === "system"}
              onChange={() => setSaved(setMotionPreference("system"))}
            />
            Follow device
          </label>
          <label>
            <input
              type="radio"
              name="animation-preference"
              value="reduce"
              checked={preference === "reduce"}
              onChange={() => setSaved(setMotionPreference("reduce"))}
            />
            Reduce animation
          </label>
        </fieldset>
        <p role="status" id="motion-preference-status">
          {!ready
            ? "Enable JavaScript to change this setting."
            : reduced
              ? "Reduced motion is on."
              : "Animations follow your device."}
          {!saved && " Applied for this visit; browser storage is unavailable."}
        </p>
        <p id="motion-preference-help">
          Your device’s reduced-motion setting is always respected.
        </p>
      </div>
    </details>
  );
}
