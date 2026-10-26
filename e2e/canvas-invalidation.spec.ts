import { expect, test } from "@playwright/test";

for (const id of ["jet-engine", "gravity-loom", "signal-sculpture"])
  test(`${id} coalesces paused environmental changes without changing pixels on no-op events`, async ({
    page,
  }) => {
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
    const before = await canvas.evaluate((node: HTMLCanvasElement) => ({
      paints: Number(node.dataset.paints),
      pixels: node.toDataURL(),
      width: node.width,
      height: node.height,
    }));
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
    await expect
      .poll(() =>
        canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
      )
      .toBe(before.pixels);
  });
