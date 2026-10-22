import { useCallback, useEffect, useState, type RefObject } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { REDUCED_MOTION } from "./usePlaybackInterruption";

/** Opt-in autoplay: visibility suspends playback without undoing a manual pause. */
export function useViewportPlayback(
  target: RefObject<HTMLElement | null>,
  available: boolean,
) {
  const reduced = useMediaQuery(REDUCED_MOTION);
  const [requested, setRequested] = useState(true);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const play = useCallback(() => setRequested(true), []);
  const pause = useCallback(() => setRequested(false), []);

  useEffect(() => {
    const node = target.current;
    if (!node) return;
    const visibility = () => setVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const measure = () => {
      const box = node.getBoundingClientRect();
      setInView(
        box.width > 0 &&
          box.height > 0 &&
          box.bottom > 0 &&
          box.top < innerHeight &&
          box.right > 0 &&
          box.left < innerWidth,
      );
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver(
            (entries) => {
              // A scroll/layout cycle can queue several changes for this one
              // target. The final entry describes its current visibility.
              const entry = entries[entries.length - 1];
              if (entry)
                setInView(entry.isIntersecting && entry.intersectionRatio > 0);
            },
            { threshold: [0, 0.01] },
          );
    if (observer) observer.observe(node);
    else {
      measure();
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
    }
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  return {
    playing: requested && inView && visible && available && !reduced,
    inView,
    visible,
    reduced,
    play,
    pause,
  };
}
