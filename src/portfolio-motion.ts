type SectionPosition = { id: string; top: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Follow document order, including short final sections at the page bottom. */
export function readingSection(
  sections: readonly SectionPosition[],
  viewportHeight: number,
  atBottom: boolean,
): string | undefined {
  if (atBottom) return sections.at(-1)?.id;
  const line = Math.min(240, viewportHeight * 0.32);
  let current = sections[0]?.id;
  for (const section of sections) if (section.top <= line) current = section.id;
  return current;
}

export function isPlainNavigation(
  event: Pick<
    MouseEvent,
    | "button"
    | "metaKey"
    | "ctrlKey"
    | "shiftKey"
    | "altKey"
    | "defaultPrevented"
  >,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** Native links own scrolling, URL history, and focus. This only paints feedback. */
export function observePortfolioMotion(
  root: HTMLElement,
  nav: HTMLElement,
  view: Window = window,
) {
  const doc = root.ownerDocument;
  const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
  const links = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  );
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>(":scope > section[id]"),
  );
  const timeline = Array.from(
    root.querySelectorAll<HTMLElement>(".experience-list > li"),
  );
  const frame = root.closest<HTMLElement>(".portfolio-frame")!;
  let active: string | undefined;
  let pending: string | undefined;
  let landed: { id: string; y: number } | undefined;
  let raf = 0;
  let settled = 0;
  let disposed = false;
  let initialized = false;
  let pulse: Animation | undefined;

  function cancelPulse() {
    pulse?.cancel();
    pulse = undefined;
  }
  function announceArrival(id: string) {
    cancelPulse();
    if (motion.matches) return;
    const line = sections
      .find((section) => section.id === id)
      ?.querySelector<HTMLElement>(".section-signal");
    if (!line?.animate) return;
    const animation = line.animate(
      [
        { transform: "scaleX(0)", opacity: 0, offset: 0 },
        { transform: "scaleX(0.25)", opacity: 1, offset: 0.2 },
        { transform: "scaleX(1)", opacity: 0.9, offset: 0.7 },
        { transform: "scaleX(1)", opacity: 0, offset: 1 },
      ],
      { duration: 950, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    pulse = animation;
    animation.finished.then(
      () => {
        if (pulse === animation) pulse = undefined;
      },
      () => {},
    );
  }
  function markNavigation(id: string | undefined) {
    for (const link of links) {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    const selected = links.find((link) => link.hash === `#${id}`);
    if (!selected) return;
    nav.style.setProperty("--nav-x", `${selected.offsetLeft}px`);
    nav.style.setProperty("--nav-y", `${selected.offsetTop}px`);
    nav.style.setProperty("--nav-w", `${selected.offsetWidth}px`);
    nav.style.setProperty("--nav-h", `${selected.offsetHeight}px`);
    nav.dataset.ready = "true";
  }
  function update() {
    raf = 0;
    if (disposed) return;
    const height = view.innerHeight;
    const range = doc.documentElement.scrollHeight - height;
    const atBottom = range > 0 && view.scrollY >= range - 3;
    const positions = sections.map((section) => ({
      id: section.id,
      top: section.getBoundingClientRect().top,
    }));
    // A short destination may share the bottom viewport with the next section.
    // Keep the visitor's explicit selection until they resume browsing.
    if (landed) {
      const rect = sections
        .find((section) => section.id === landed?.id)
        ?.getBoundingClientRect();
      if (
        Math.abs(view.scrollY - landed.y) > 3 ||
        !rect ||
        rect.top >= height ||
        rect.bottom <= 0
      )
        landed = undefined;
    }
    const current = landed?.id ?? readingSection(positions, height, atBottom);
    if (!pending && current !== active) {
      if (initialized && current) announceArrival(current);
      active = current;
    }
    markNavigation(pending ?? active);
    frame.style.setProperty(
      "--reading-progress",
      String(range > 0 ? clamp(view.scrollY / range) : 0),
    );
    for (const item of timeline) {
      const rect = item.getBoundingClientRect();
      const progress = clamp(
        (height * 0.68 - rect.top) / Math.max(1, rect.height),
      );
      item.style.setProperty("--trace-progress", String(progress));
      item.dataset.traced = String(progress > 0);
    }
    initialized = true;
  }
  function schedule() {
    if (!disposed && !raf) raf = view.requestAnimationFrame(update);
  }
  function finishNavigation() {
    settled = 0;
    if (!pending) return;
    const destination = sections.find((section) => section.id === pending);
    const rect = destination?.getBoundingClientRect();
    if (rect && rect.top < view.innerHeight && rect.bottom > 0) {
      announceArrival(pending);
      active = pending;
      landed = { id: pending, y: view.scrollY };
    }
    pending = undefined;
    schedule();
  }
  function onScroll() {
    schedule();
    if (pending) {
      view.clearTimeout(settled);
      settled = view.setTimeout(finishNavigation, 160);
    }
  }
  function beginNavigation(id: string) {
    pending = id;
    landed = undefined;
    cancelPulse();
    markNavigation(id);
    view.clearTimeout(settled);
    // Also completes clicks that need no scroll and reduced-motion jumps.
    settled = view.setTimeout(finishNavigation, 160);
  }
  function onClick(event: MouseEvent) {
    if (!isPlainNavigation(event)) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!link || !links.includes(link)) return;
    const id = link.hash.slice(1);
    if (sections.some((section) => section.id === id)) beginNavigation(id);
  }
  function interrupt() {
    pending = undefined;
    landed = undefined;
    view.clearTimeout(settled);
    cancelPulse();
    schedule();
  }
  function onKey(event: KeyboardEvent) {
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
        "Escape",
        "Tab",
      ].includes(event.key)
    )
      interrupt();
  }
  function syncMotion() {
    if (motion.matches) cancelPulse();
    schedule();
  }
  function onHashChange() {
    const id = view.location.hash.slice(1);
    if (!sections.some((section) => section.id === id)) {
      interrupt();
      return;
    }
    // Includes back/forward and in-page links outside the main menu.
    if (pending !== id && landed?.id !== id) beginNavigation(id);
    schedule();
  }
  const resize =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(schedule);
  resize?.observe(root);
  resize?.observe(nav);
  view.addEventListener("scroll", onScroll, { passive: true });
  view.addEventListener("resize", schedule);
  view.addEventListener("hashchange", onHashChange);
  view.addEventListener("wheel", interrupt, { passive: true });
  view.addEventListener("touchstart", interrupt, { passive: true });
  view.addEventListener("keydown", onKey);
  nav.addEventListener("click", onClick);
  motion.addEventListener("change", syncMotion);
  doc.fonts?.ready.then(schedule);
  update();
  return () => {
    disposed = true;
    view.cancelAnimationFrame(raf);
    view.clearTimeout(settled);
    cancelPulse();
    resize?.disconnect();
    view.removeEventListener("scroll", onScroll);
    view.removeEventListener("resize", schedule);
    view.removeEventListener("hashchange", onHashChange);
    view.removeEventListener("wheel", interrupt);
    view.removeEventListener("touchstart", interrupt);
    view.removeEventListener("keydown", onKey);
    nav.removeEventListener("click", onClick);
    motion.removeEventListener("change", syncMotion);
    links.forEach((link) => link.removeAttribute("aria-current"));
    delete nav.dataset.ready;
  };
}
