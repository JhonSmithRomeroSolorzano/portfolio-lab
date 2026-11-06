import type { Page, TestInfo } from "@playwright/test";

type DiagnosticWindow = Window & {
  __navigationDiagnostics?: {
    events: unknown[];
    snapshot: () => unknown;
  };
};

/** Install after readiness assertions, never during hydration. */
export async function installNavigationDiagnostics(
  page: Page,
  mode:
    | "barrier"
    | "geometry"
    | "calls"
    | "events"
    | "on"
    | "focus-allow"
    | "focus-prevent" = "on",
) {
  await page.evaluate((mode) => {
    // Control for the extra page-evaluation task without installing a probe.
    if (mode === "barrier") return;
    if (mode === "focus-allow" || mode === "focus-prevent") {
      document
        .getElementById("main-navigation")
        ?.addEventListener("mousedown", (event) => {
          if (
            mode === "focus-prevent" &&
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey &&
            (event.target as Element).closest('a[href^="#"]')
          )
            event.preventDefault();
        });
      return;
    }
    const view = window as DiagnosticWindow;
    const events: unknown[] = [];
    const root = document.documentElement;
    const snapshot = () => {
      const focus = document.activeElement;
      const lab = document.getElementById("lab");
      return {
        time: performance.now(),
        y: scrollY,
        hash: location.hash,
        focus: focus?.id,
        focusVisible: focus?.matches(":focus-visible"),
        behavior: getComputedStyle(root).scrollBehavior,
        pointer: lab?.dataset.pointerNavigation,
        labTop: lab?.getBoundingClientRect().top,
        collectionTop: document
          .getElementById("collection")
          ?.getBoundingClientRect().top,
        height: root.scrollHeight,
        viewport: [innerWidth, innerHeight],
        fonts: document.fonts.status,
        theme: root.dataset.theme,
        motion: root.dataset.motion,
      };
    };
    const record = (event: string, details?: unknown) => {
      // Do not force style/layout inside focus() or native focus events.
      if (events.length < 200)
        events.push({
          event,
          details,
          time: performance.now(),
          ...(mode === "calls" ? {} : { y: scrollY }),
          hash: location.hash,
          focus: document.activeElement?.id,
          pointer: document.getElementById("lab")?.dataset.pointerNavigation,
        });
    };
    view.__navigationDiagnostics = { events, snapshot };
    if (mode === "geometry") {
      record("initial-geometry", snapshot());
      return;
    }
    for (const [host, methods] of [
      [HTMLElement.prototype, ["focus"]],
      [Element.prototype, ["scrollIntoView", "scroll", "scrollTo", "scrollBy"]],
      [window, ["scroll", "scrollTo", "scrollBy"]],
    ] as const) {
      const methodsHost = host as unknown as Record<
        string,
        (...args: unknown[]) => unknown
      >;
      for (const name of methods) {
        const native = methodsHost[name];
        methodsHost[name] = function (
          this: HTMLElement | Window,
          ...args: unknown[]
        ) {
          record(name, {
            target:
              this instanceof Element ? this.id || this.tagName : "window",
            args,
            stack: new Error().stack,
          });
          return Reflect.apply(native, this, args);
        };
      }
    }
    for (const type of mode === "calls"
      ? ["click", "focusin", "focusout"]
      : ["click", "focusin", "focusout", "scrollend"])
      window.addEventListener(type, () => record(type));
    window.addEventListener("hashchange", () =>
      record(
        "hashchange",
        mode === "on"
          ? { behavior: getComputedStyle(root).scrollBehavior }
          : undefined,
      ),
    );
    if (mode === "calls") {
      record("attached");
      return;
    }
    let lastScroll = -Infinity;
    window.addEventListener("scroll", () => {
      if (performance.now() - lastScroll < 200) return;
      lastScroll = performance.now();
      record("scroll");
    });
    const resize = new ResizeObserver((entries) => {
      record(
        "layout-resize",
        entries.map((entry) => ({
          target: entry.target.id || entry.target.tagName,
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })),
      );
    });
    for (const target of [
      document.querySelector("main"),
      document.querySelector("header"),
    ])
      if (target) resize.observe(target);
    record("attached", mode === "on" ? snapshot() : undefined);
  }, mode);
}

/** Evidence only: no waits, scroll corrections, or changes to assertions/retries. */
export async function attachNavigationDiagnostics(
  page: Page | null | undefined,
  info: TestInfo,
) {
  // Failed page fixtures can reach afterEach without creating a page.
  if (!page || info.status === info.expectedStatus || page.isClosed()) return;
  const state = await page.evaluate(() => {
    const diagnostic = (window as DiagnosticWindow).__navigationDiagnostics;
    return diagnostic
      ? { events: diagnostic.events, final: diagnostic.snapshot() }
      : null;
  });
  if (state)
    await info.attach("navigation-events", {
      body: JSON.stringify(state, null, 2),
      contentType: "application/json",
    });
}
