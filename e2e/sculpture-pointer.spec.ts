import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  for (const form of ["Monogram", "Ribbon", "Orbit"]) {
    test(`${form} mouse input eases without snapping or disturbing pause in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1100 });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "no-preference",
      });
      await page.clock.install({ time: new Date("2026-10-21T12:00:00Z") });
      await page.clock.pauseAt(new Date("2026-10-21T12:01:00Z"));
      await page.goto("/#signal-sculpture");
      const exhibit = page.locator("#signal-sculpture");
      const stage = exhibit.locator(".sculpture-stage");
      // The clock is frozen for pixel comparisons, so finish lazy-entry layout first.
      await stage.scrollIntoViewIfNeeded();
      await page.clock.runFor(32);
      await expect(stage).toHaveAttribute("data-playing", "true");
      const box = (await stage.boundingBox())!;
      const pixels = () =>
        exhibit.locator("canvas").evaluate(async (node: HTMLCanvasElement) => {
          const context = node.getContext("2d")!;
          const { data } = context.getImageData(0, 0, node.width, node.height);
          // Compare every raw pixel without PNG encoding or transferring large images.
          const digest = await crypto.subtle.digest("SHA-256", data);
          return Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
        });
      const button = (name: string) =>
        exhibit.getByRole("button", { name, exact: true });
      const start = async () => {
        await button("Reset").press("Enter");
        await button(form).press("Enter");
        await button("Play").press("Enter");
        await expect(stage).toHaveAttribute("data-playing", "true");
      };
      // Compare the same elapsed animation time, isolating pointer input from spin.
      await start();
      await page.clock.runFor(400);
      const neutral = await pixels();
      await start();
      const beforeEntry = await pixels();
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);
      expect(await pixels()).toBe(beforeEntry);
      await page.clock.runFor(400);
      const tilted = await pixels();
      expect(tilted).not.toBe(neutral);
      await page.mouse.move(box.x + box.width + 8, box.y + box.height / 2);
      expect(await pixels()).toBe(tilted);
      await page.clock.runFor(400);
      expect(await pixels()).not.toBe(tilted);
      await button("Pause").press("Enter");
      const paused = await pixels();
      await page.mouse.move(box.x + 20, box.y + 20);
      await page.clock.runFor(400);
      expect(await pixels()).toBe(paused);
      await button("Reset").press("Enter");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(button("Play")).toBeDisabled();
      const still = await pixels();
      await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20);
      await page.clock.runFor(400);
      expect(await pixels()).toBe(still);
    });
  }
}
