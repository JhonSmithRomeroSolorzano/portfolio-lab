import { useSyncExternalStore } from "react";
import {
  currentMotionPreference,
  motionQuery,
  type MotionQuery,
} from "../motion/motion-preference";
import type { MotionPreference } from "../motion/motion-preference";

let source: MotionQuery | undefined;
// Browser-only lazy creation keeps prerendering safe. Subscriptions and React
// snapshots must read the same MediaQueryList, not fresh instances per snapshot.
function motionSource() {
  return (source ??= motionQuery());
}
function subscribe(change: () => void) {
  const query = motionSource();
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => motionSource().matches,
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
