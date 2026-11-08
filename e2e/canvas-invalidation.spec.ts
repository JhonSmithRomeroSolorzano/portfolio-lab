import { expect, test } from "@playwright/test";

/** Serializable state accompanying exact pixels, not a visual-diff tolerance. */
function canvasSnapshot(node: HTMLCanvasElement) {
  const css = getComputedStyle(node);
  const transform = node.getContext("2d")?.getTransform();
  return {
    paints: Number(node.dataset.paints),
    pixels: node.toDataURL(),
    width: node.width,
    height: node.height,
    box: node.getBoundingClientRect().toJSON(),
    logicalSize: [css.width, css.height],
    lastPaintSize: [node.dataset.paintWidth, node.dataset.paintHeight],
    pixelRatio: devicePixelRatio,
    transform: transform
      ? [
          transform.a,
          transform.b,
          transform.c,
          transform.d,
          transform.e,
          transform.f,
        ]
      : null,
    theme: document.documentElement.dataset.theme,
    motion: document.documentElement.dataset.motion,
    viewport: [innerWidth, innerHeight],
    threadColors: [1, 2, 3].map((index) =>
      css.getPropertyValue(`--loom-thread-${index}`).trim(),
    ),
  };
}

for (const id of ["jet-engine", "gravity-loom", "signal-sculpture"])
  test(`${id} coalesces paused environmental changes without changing pixels on no-op events`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      for (const method of ["clearRect", "putImageData"] as const) {
        const native = CanvasRenderingContext2D.prototype[method];
        CanvasRenderingContext2D.prototype[method] = function (
          ...args: unknown[]
        ) {
          const canvas = this.canvas as HTMLCanvasElement;
          canvas.dataset.paints = String(
            Number(canvas.dataset.paints ?? 0) + 1,
          );
          if (method === "clearRect") {
            canvas.dataset.paintWidth = String(args[2]);
            canvas.dataset.paintHeight = String(args[3]);
          }
          return Reflect.apply(native, this, args);
        };
      }
    });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/#${id}`);
    const canvas = page.locator(`#${id} canvas`);
    await expect(canvas).toBeVisible();
    // Flush initial ResizeObserver delivery before counting intentional bursts.
    await canvas.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const before = await canvas.evaluate(canvasSnapshot);
    await canvas.evaluate(async () => {
      for (let i = 0; i < 12; i++) {
        window.dispatchEvent(new Event("resize"));
        document.documentElement.setAttribute(
          "data-theme",
          document.documentElement.dataset.theme!,
        );
      }
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) =>
        Number(node.dataset.paints),
      ),
    ).toBe(before.paints);
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
    ).toBe(before.pixels);
    await canvas.evaluate(async () => {
      for (const theme of ["dark", "light", "dark"]) {
        document.documentElement.dataset.theme = theme;
        window.dispatchEvent(new Event("resize"));
      }
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) =>
        Number(node.dataset.paints),
      ),
    ).toBe(before.paints + 1);
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
    ).not.toBe(before.pixels);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width))
      .not.toBe(before.width);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    try {
      await expect
        .poll(() =>
          canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
        )
        .toBe(before.pixels);
    } catch (error) {
      // Attach the actual baseline and failed restoration, not page screenshots:
      // a one-pixel raster difference can be invisible in a composite screenshot.
      // Diagnostics must never replace the original assertion failure.
      try {
        const after = await canvas.evaluate(canvasSnapshot);
        await Promise.all([
          ...(["before", "after"] as const).map((label) =>
            testInfo.attach(`canvas-${label}`, {
              body: Buffer.from(
                (label === "before" ? before : after).pixels.split(",")[1],
                "base64",
              ),
              contentType: "image/png",
            }),
          ),
          testInfo.attach("canvas-restoration-state", {
            body: JSON.stringify(
              {
                experience: id,
                browser: testInfo.project.name,
                retry: testInfo.retry,
                before: { ...before, pixels: undefined },
                after: { ...after, pixels: undefined },
              },
              null,
              2,
            ),
            contentType: "application/json",
          }),
        ]);
      } catch (diagnosticError) {
        console.error(
          "Could not capture canvas restoration state",
          diagnosticError,
        );
      }
      throw error;
    }
  });
