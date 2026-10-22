export const MOTION_KEY = "portfolio-motion";
export const MOTION_CHANGE = "portfolio:motion-change";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export type MotionPreference = "system" | "reduce";

export function motionPreference(value: string | null): MotionPreference {
  return value === "reduce" ? "reduce" : "system";
}

export function resolvedMotion(
  preference: MotionPreference,
  deviceReduced: boolean,
) {
  return preference === "reduce" || deviceReduced;
}

export function currentMotionPreference(root = document.documentElement) {
  return motionPreference(root.dataset?.motionPreference ?? null);
}

/** The root also holds the visit-local choice when storage is unavailable. */
export function setMotionPreference(
  preference: MotionPreference,
  view: Window = window,
) {
  const root = view.document.documentElement;
  root.dataset.motionPreference = preference;
  root.dataset.motion = resolvedMotion(
    preference,
    view.matchMedia(REDUCED_MOTION).matches,
  )
    ? "reduce"
    : "full";
  let saved = true;
  try {
    view.localStorage.setItem(MOTION_KEY, preference);
  } catch {
    saved = false;
  }
  view.dispatchEvent(new Event(MOTION_CHANGE));
  return saved;
}

export type MotionQuery = {
  readonly matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
};

/** One effective motion policy for React, imperative animation, and CSS. */
export function motionQuery(
  view: Window = window,
  root = view.document.documentElement,
): MotionQuery {
  const device = view.matchMedia(REDUCED_MOTION);
  const reduced = () =>
    resolvedMotion(currentMotionPreference(root), device.matches);
  const cleanups = new Map<() => void, () => void>();
  return {
    get matches() {
      return reduced();
    },
    addEventListener(_type, listener) {
      if (cleanups.has(listener)) return;
      const change = () => {
        if (root.dataset) root.dataset.motion = reduced() ? "reduce" : "full";
        listener();
      };
      const storage = (event: StorageEvent) => {
        if (event.key !== MOTION_KEY && event.key !== null) return;
        if (event.storageArea) {
          try {
            if (event.storageArea !== view.localStorage) return;
          } catch {
            return;
          }
        }
        root.dataset.motionPreference = motionPreference(event.newValue);
        change();
      };
      device.addEventListener("change", change);
      view.addEventListener(MOTION_CHANGE, change);
      view.addEventListener("storage", storage);
      if (root.dataset) root.dataset.motion = reduced() ? "reduce" : "full";
      cleanups.set(listener, () => {
        device.removeEventListener("change", change);
        view.removeEventListener(MOTION_CHANGE, change);
        view.removeEventListener("storage", storage);
      });
    },
    removeEventListener(_type, listener) {
      cleanups.get(listener)?.();
      cleanups.delete(listener);
    },
  };
}
