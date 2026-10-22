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
    const media = motionQuery();
    const visibility = () => {
      if (document.hidden) stop();
    };
    const navigate = () => {
      if (activeHashes && !activeHashes.includes(window.location.hash)) stop();
    };
    const observer =
      target?.current && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            if (entries.some((entry) => !entry.isIntersecting)) stop();
          })
        : undefined;
    if (target?.current) observer?.observe(target.current);
    media.addEventListener("change", stop);
    document.addEventListener("visibilitychange", visibility);
    if (activeHashes) window.addEventListener("hashchange", navigate);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", visibility);
      if (activeHashes) window.removeEventListener("hashchange", navigate);
    };
  }, [stop, target, activeHashes]);
}
