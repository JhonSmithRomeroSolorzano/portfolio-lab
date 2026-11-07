import type { Page, TestInfo } from "@playwright/test";

/** Read only after failure: instrumentation during travel can mask this regression. */
export async function attachNavigationDiagnostics(
  page: Page | null | undefined,
  info: TestInfo,
) {
  if (!page || info.status === info.expectedStatus || page.isClosed()) return;
  let state: unknown;
  try {
    state = await page.evaluate(() => {
      const root = document.documentElement;
      const focus = document.activeElement;
      const lab = document.getElementById("lab");
      return {
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
        beforeNativeNavigation: root.dataset.beforeNativeNavigation,
      };
    });
  } catch (error) {
    // Preserve the original assertion/fixture failure if its page became unusable.
    await info.attach("navigation-state-unavailable", {
      body: String(error),
      contentType: "text/plain",
    });
    return;
  }
  await info.attach("navigation-state", {
    body: JSON.stringify(state, null, 2),
    contentType: "application/json",
  });
}
