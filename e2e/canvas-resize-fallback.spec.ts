import { expect, test } from "@playwright/test";

for (const id of ["signal-sculpture", "gravity-loom"]) {
  for (const { width, theme, motion } of [
    { width: 390, theme: "light", motion: "reduce" },
    { width: 1280, theme: "dark", motion: "no-preference" },
  ] as const) {
    test(`${id} draws at its visible size without ResizeObserver at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: motion });
      await page.addInitScript(() => {
        Object.defineProperty(window, "ResizeObserver", {
          configurable: true,
          value: undefined,
        });
      });
      await page.goto(`/#${id}`);
      const section = page.locator(`#${id}`);
      const canvas = section.locator("canvas");
      await expect(canvas).toBeVisible();
      // Availability unhides the drawing after its initial measurement. No
      // synthetic resize or theme event may be needed to paint usable pixels.
      await expect
        .poll(() =>
          canvas.evaluate((node: HTMLCanvasElement) => {
            const box = node.getBoundingClientRect();
            const ratio = Math.min(devicePixelRatio || 1, 2);
            return {
              drawable: box.width > 1 && box.height > 1,
              sized:
                node.width === Math.round(box.width * ratio) &&
                node.height === Math.round(box.height * ratio),
            };
          }),
        )
        .toEqual({ drawable: true, sized: true });
      if (motion === "no-preference") {
        await section
          .getByRole("button", { name: "Pause", exact: true })
          .click();
      }
      await expect(
        section.getByRole("button", { name: "Play", exact: true }),
      ).toBeVisible();
      const pixels = await canvas.evaluate((node: HTMLCanvasElement) => {
        const data = node
          .getContext("2d")!
          .getImageData(0, 0, node.width, node.height).data;
        let painted = 0;
        for (let index = 3; index < data.length; index += 4) {
          if (data[index] > 0) painted++;
        }
        return painted;
      });
      expect(pixels).toBeGreaterThan(100);
    });
  }
}
