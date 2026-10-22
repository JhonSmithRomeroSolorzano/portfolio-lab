import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`processing labels keep contrast at the instant each state changes in ${theme}`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-22T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-22T12:01:00Z"));
    await page.goto("/");
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    const backend = page.locator(".stack-node-backend");
    await backend.click();
    const samples = await backend.evaluate((element) => {
      const luminance = (color: string) => {
        const channels = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const samples: number[] = [];
      for (const active of ["true", "false", "true", "false"]) {
        // Resolve the previous style first, so a background transition cannot
        // hide behind coalesced style updates. Read again before the next paint.
        getComputedStyle(element).getPropertyValue("background-color");
        element.setAttribute("data-flow-active", active);
        const background = luminance(getComputedStyle(element).backgroundColor);
        for (const selector of [
          "strong",
          ".map-node-selection",
          ".map-node-activity",
        ]) {
          const foreground = luminance(
            getComputedStyle(element.querySelector(selector)!).color,
          );
          samples.push(
            (Math.max(background, foreground) + 0.05) /
              (Math.min(background, foreground) + 0.05),
          );
        }
      }
      return samples;
    });
    for (const ratio of samples) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  for (const width of [390, 320]) {
    test(`map text and detail selection remain clear at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await page.evaluate(() => document.fonts.ready);
      const sizes = await page
        .locator(
          ".map-caption, .stack-node > span, .map-node-selection, .map-node-activity, .map-flow-readout, .map-flow-count, .map-footnote, .stack-detail-label, .stack-facts dt, .workbench-caption",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)),
        );
      expect(sizes.every((size) => size >= 12)).toBe(true);
      const detail = page.getByRole("region", {
        name: "Selected stack experience",
      });
      await expect(detail.locator(".stack-detail-label:visible")).toHaveText(
        "Viewing Frontend",
      );
      await page.locator(".stack-node-data").focus();
      await page.keyboard.press("Enter");
      await expect(detail.locator(".stack-detail-label:visible")).toHaveText(
        "Viewing Data",
      );
      await expect(
        page.locator(".stack-node-data .map-node-selection"),
      ).toBeVisible();
      await expect(
        page.locator(".stack-node-frontend .map-node-selection"),
      ).not.toBeVisible();
      await expect(page.locator(".map-flow-count")).toHaveText("FLOW");
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      const layout = await page.evaluate(() => ({
        pageFits: document.documentElement.scrollWidth <= innerWidth,
        nodesFit: [
          ...document.querySelectorAll<HTMLElement>(".stack-node"),
        ].every((node) => node.scrollWidth <= node.clientWidth + 1),
        captionBottom: document
          .querySelector(".map-caption")!
          .getBoundingClientRect().bottom,
        nodesTop: document
          .querySelector(".map-topology")!
          .getBoundingClientRect().top,
      }));
      expect(layout.pageFits).toBe(true);
      expect(layout.nodesFit).toBe(true);
      expect(layout.captionBottom).toBeLessThanOrEqual(layout.nodesTop);
    });
  }
}
