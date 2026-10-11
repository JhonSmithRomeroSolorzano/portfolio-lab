/** Progressive enhancement: content is readable before, during, and without motion. */
export function observeScrollReveals(
  root: HTMLElement,
  motion: MediaQueryList = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ),
  Observer:
    typeof IntersectionObserver | undefined = window.IntersectionObserver,
): () => void {
  if (!Observer) return () => {};
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]"),
  );
  const seen = new Set<Element>();
  const active = new Map<HTMLElement, Animation>();
  const observer = new Observer(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        const element = entry.target as HTMLElement;
        seen.add(element);
        observer.unobserve(element);
        if (
          motion.matches ||
          element.matches(":focus-within") ||
          typeof element.animate !== "function"
        )
          continue;
        const delay = Math.min(
          160,
          Math.max(0, Number(element.dataset.reveal) || 0),
        );
        const animation = element.animate(
          [
            { opacity: 0.35, transform: "translateY(16px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 560,
            delay,
            easing: "cubic-bezier(.2,.7,.2,1)",
            fill: "backwards",
          },
        );
        active.set(element, animation);
        animation.finished.then(
          () => active.delete(element),
          () => active.delete(element),
        );
      }
    },
    { threshold: 0.08 },
  );

  function cancelActive() {
    for (const animation of active.values()) animation.cancel();
    active.clear();
  }
  function syncMotion() {
    observer.disconnect();
    if (motion.matches) cancelActive();
    else
      for (const element of targets)
        if (!seen.has(element)) observer.observe(element);
  }
  function onFocus(event: FocusEvent) {
    for (const [element, animation] of active) {
      if (event.target && element.contains(event.target as Node)) {
        animation.cancel();
        active.delete(element);
      }
    }
  }
  motion.addEventListener("change", syncMotion);
  root.addEventListener("focusin", onFocus);
  syncMotion();
  return () => {
    observer.disconnect();
    cancelActive();
    motion.removeEventListener("change", syncMotion);
    root.removeEventListener("focusin", onFocus);
  };
}
