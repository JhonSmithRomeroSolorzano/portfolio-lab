import { useSyncExternalStore } from "react";
import {
  currentMotionPreference,
  motionQuery,
} from "../motion/motion-preference";
import type { MotionPreference } from "../motion/motion-preference";

function subscribe(change: () => void) {
  const source = motionQuery();
  source.addEventListener("change", change);
  return () => source.removeEventListener("change", change);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => motionQuery().matches,
    () => false,
  );
}

export function useMotionPreference() {
  return useSyncExternalStore(
    subscribe,
    () => currentMotionPreference(),
    (): MotionPreference => "system",
  );
}
