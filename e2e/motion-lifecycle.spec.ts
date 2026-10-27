import { test, expect } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

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
      await play.focus();
      await play.scrollIntoViewIfNeeded();
      await expect(play).toBeInViewport({ ratio: 1 });
      // Keyboard navigation leaves the pointer at the viewport edge. Position
      // the later wheel gesture over the experience before starting playback.
      if (exit === "scrolling") await play.hover();
      await play.press("Enter");
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
      await expect(page.locator(".motion-feedback")).toHaveText(
        "Comparing both curves…",
      );

      if (exit === "navigation") {
        await openMainNavigation(page);
        await page
          .getByRole("navigation", { name: "Main navigation", exact: true })
          .getByRole("link", { name: "Experience", exact: true })
          .press("Enter");
      } else {
        // Native wheel distances differ across engines. Observe an actual
        // exit instead of assuming one oversized delta reaches the page top.
        await expect(async () => {
          await page.mouse.wheel(0, -800);
          await expect(page.locator("#motion-studio")).not.toBeInViewport({
            timeout: 200,
          });
        }).toPass({ timeout: 5000, intervals: [100] });
        await expect(page).toHaveURL(/#motion-studio$/);
        // Multiple wheel events can produce multiple scrollend events. Wait
        // for a quiet scroll interval before making another keyboard journey.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              let quiet: ReturnType<typeof setTimeout>;
              const finish = () => {
                document.removeEventListener("scroll", moving);
                resolve();
              };
              const moving = () => {
                clearTimeout(quiet);
                quiet = setTimeout(finish, 150);
              };
              document.addEventListener("scroll", moving, { passive: true });
              moving();
            }),
        );
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
      // press() focuses but does not wait for WebKit's focus scrolling. Make
      // the control visible before starting the replay's short live clock.
      await play.focus();
      await play.scrollIntoViewIfNeeded();
      await expect(play).toBeInViewport({ ratio: 1 });
      await expect(feedback).toContainText("Ready when you are");
      await play.press("Enter");
      await expect(feedback).toHaveText("Comparing both curves…");
      await expect(feedback).toContainText("Both arrived together");
    });
  }
}
