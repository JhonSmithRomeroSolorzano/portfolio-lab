import { useEffect, type RefObject } from "react";
import { motionQuery } from "../motion/motion-preference";

export { REDUCED_MOTION } from "../motion/motion-preference";

type Options = {
  target?: RefObject<HTMLElement | null>;
  activeHashes?: readonly string[];
};

/** Browser lifecycle only: the caller decides how its own animation stops. */
export function usePlaybackInterruption(
  stop: () => void,
  { target, activeHashes }: Options = {},
) {
  useEffect(() => {
    const node = target?.current;
    const media = motionQuery();
    const visibility = () => {
      if (document.hidden) stop();
    };
    const navigate = () => {
      if (activeHashes && !activeHashes.includes(window.location.hash)) stop();
    };
    const measure = () => {
      if (!node) return;
      const box = node.getBoundingClientRect();
      if (
        box.width <= 0 ||
        box.height <= 0 ||
        box.bottom <= 0 ||
        box.top >= innerHeight ||
        box.right <= 0 ||
        box.left >= innerWidth
      )
        stop();
    };
    const observer =
      node && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            // One observed target: queued earlier transitions must not override
            // its latest visibility, just as in useViewportPlayback.
            const entry = entries[entries.length - 1];
            if (entry && !entry.isIntersecting) stop();
          })
        : undefined;
    if (node) {
      if (observer) observer.observe(node);
      else {
        measure();
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
      }
    }
    media.addEventListener("change", stop);
    document.addEventListener("visibilitychange", visibility);
    if (activeHashes) window.addEventListener("hashchange", navigate);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", visibility);
      if (activeHashes) window.removeEventListener("hashchange", navigate);
    };
  }, [stop, target, activeHashes]);
}
