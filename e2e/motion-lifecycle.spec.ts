import { test, expect } from "@playwright/test";

for (const width of [1280, 390]) {
  for (const exit of ["navigation", "scrolling"] as const) {
    test(`motion stops after ${exit} away at ${width}px and waits for explicit replay`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      const entry = page
        .getByRole("navigation", { name: "Explore the collection" })
        .getByRole("link", { name: /Motion studio/ });
      await entry.press("Enter");
      await expect(page.locator("#motion-studio")).toBeFocused();
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
      await page.getByRole("slider", { name: /Duration/ }).fill("1800");
      const play = page.getByRole("button", { name: /Play motion/ });
      await play.press("Enter");
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
      await expect(page.locator(".motion-feedback")).toHaveText(
        "Comparing both curves…",
      );

      if (exit === "navigation") {
        await page
          .getByRole("navigation", { name: "Main navigation", exact: true })
          .getByRole("link", { name: "Résumé", exact: true })
          .press("Enter");
      } else {
        // Real scroll input leaves immediately, without waiting for another
        // section's entrance animation or changing the URL/hash.
        await page.mouse.wheel(0, -20000);
        await expect(page.locator("#motion-studio")).not.toBeInViewport();
        await expect(page).toHaveURL(/#motion-studio$/);
      }

      const feedback = page.locator(".motion-feedback");
      await expect(feedback).toContainText("Ready when you are");
      expect(
        await page
          .locator(".motion-runner")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAnimations().length),
          ),
      ).toEqual([0, 0]);
      await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(0);

      await entry.press("Enter");
      await expect(feedback).toContainText("Ready when you are");
      await play.press("Enter");
      await expect(feedback).toHaveText("Comparing both curves…");
      await expect(feedback).toContainText("Both arrived together");
    });
  }
}
