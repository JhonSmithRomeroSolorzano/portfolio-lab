import { expect, test, type Page } from "@playwright/test";

async function hideDocument(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

const exhibits = [
  {
    id: "jet-engine",
    state: ".jet-engine",
    stage: ".engine-stage",
    pause: "Pause engine",
    play: "Play engine",
  },
  {
    id: "gravity-loom",
    state: ".loom-stage",
    stage: ".loom-stage",
    pause: "Pause",
    play: "Play",
  },
  {
    id: "signal-sculpture",
    state: ".sculpture-stage",
    stage: ".sculpture-stage",
    pause: "Pause",
    play: "Play",
  },
];

for (const exhibit of exhibits) {
  for (const width of [390, 1440]) {
    test(`${exhibit.id} autoplays in view and preserves manual pause at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
      await page.emulateMedia({
        reducedMotion: "no-preference",
        colorScheme: width === 390 ? "dark" : "light",
      });
      await page.goto(`/#${exhibit.id}`);
      const section = page.locator(`#${exhibit.id}`);
      const state = section.locator(exhibit.state);
      const stage = section.locator(exhibit.stage);
      const pixels = () =>
        section
          .locator("canvas")
          .evaluate((node: HTMLCanvasElement) => node.toDataURL());
      await expect(state).toHaveAttribute("data-playing", "true");
      const initial = await pixels();
      await expect.poll(pixels).not.toBe(initial);
      await section.screenshot({
        path: `artifacts/autoplay-${exhibit.id}-${width}.png`,
      });

      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: "Résumé", exact: true })
        .press("Enter");
      await expect(stage).not.toBeInViewport();
      await expect(state).toHaveAttribute("data-playing", "false");
      // Ordinary scrolling must start playback even when the hash still points elsewhere.
      await stage.scrollIntoViewIfNeeded();
      await expect(page).toHaveURL(/#resume$/);
      await expect(state).toHaveAttribute("data-playing", "true");
      await hideDocument(page, true);
      await expect(state).toHaveAttribute("data-playing", "false");
      await hideDocument(page, false);
      await expect(state).toHaveAttribute("data-playing", "true");

      await section
        .getByRole("button", { name: exhibit.pause, exact: true })
        .press("Enter");
      await expect(state).toHaveAttribute("data-playing", "false");
      const paused = await pixels();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      expect(await pixels()).toBe(paused);
      await page.locator("#resume").scrollIntoViewIfNeeded();
      await stage.scrollIntoViewIfNeeded();
      await hideDocument(page, true);
      await hideDocument(page, false);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        section.getByRole("button", { name: exhibit.play, exact: true }),
      ).toBeDisabled();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(
        section.getByRole("button", { name: exhibit.play, exact: true }),
      ).toBeEnabled();
      await expect(state).toHaveAttribute("data-playing", "false");

      await section
        .getByRole("button", { name: exhibit.play, exact: true })
        .press("Enter");
      await expect(state).toHaveAttribute("data-playing", "true");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(state).toHaveAttribute("data-playing", "false");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(state).toHaveAttribute("data-playing", "true");
      await section
        .getByRole("button", { name: "Reset", exact: true })
        .press("Enter");
      await expect(state).toHaveAttribute("data-playing", "false");
      await page.locator("#resume").scrollIntoViewIfNeeded();
      await stage.scrollIntoViewIfNeeded();
      await expect(state).toHaveAttribute("data-playing", "false");
    });
  }

  test(`${exhibit.id} checks viewport visibility without IntersectionObserver`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "IntersectionObserver", {
        value: undefined,
      });
    });
    await page.goto(`/#${exhibit.id}`);
    const state = page.locator(`#${exhibit.id} ${exhibit.state}`);
    await expect(state).toHaveAttribute("data-playing", "true");
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Résumé", exact: true })
      .press("Enter");
    await expect(state).toHaveAttribute("data-playing", "false");
    await page
      .locator(`#${exhibit.id} ${exhibit.stage}`)
      .scrollIntoViewIfNeeded();
    await expect(state).toHaveAttribute("data-playing", "true");
  });
}

test("sculpture uses the latest entry when viewport changes are delivered together", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super((entries, observer) => {
          callback(
            entries.flatMap((entry) => {
              if (!entry.target.matches(".sculpture-stage")) return [entry];
              // Model a queued transition immediately before the current entry.
              const earlier = {
                target: entry.target,
                time: entry.time - 1,
                rootBounds: entry.rootBounds,
                boundingClientRect: entry.boundingClientRect,
                intersectionRect: entry.intersectionRect,
                isIntersecting: !entry.isIntersecting,
                intersectionRatio: entry.isIntersecting ? 0 : 1,
              };
              return [earlier, entry];
            }),
            observer,
          );
        }, options);
      }
    };
  });
  await page.goto("/#signal-sculpture");
  const stage = page.locator(".sculpture-stage");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  await expect(stage).not.toBeInViewport();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "true");
  await hideDocument(page, true);
  await expect(stage).toHaveAttribute("data-playing", "false");
  await hideDocument(page, false);
  await expect(stage).toHaveAttribute("data-playing", "true");
});
