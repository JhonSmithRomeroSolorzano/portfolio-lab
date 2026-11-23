import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const)
  for (const state of ["playing", "paused", "reduced", "fallback"] as const)
    test(`engine recovers from a failed theme image in ${theme}, ${state}`, async ({
      page,
    }) => {
      const failedTheme = theme === "light" ? "dark" : "light";
      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: state === "reduced" ? "reduce" : "no-preference",
      });
      if (state === "fallback")
        await page.addInitScript(() => {
          HTMLCanvasElement.prototype.getContext = () => null;
        });
      await page.route(`**/engine-back-${failedTheme}-*.svg`, (route) =>
        route.fulfill({ status: 503, body: "Unavailable" }),
      );
      await page.goto("/?recovery=art#jet-engine");
      const drawing = page.locator(
        state === "fallback" ? ".engine-fallback" : ".engine-canvas",
      );
      await expect(drawing).toBeVisible();
      await page.getByRole("button", { name: /^Cruise 60%/ }).press("Enter");
      await page
        .getByRole("button", { name: "Reverse thrust", exact: true })
        .press("Enter");
      await page.locator(".engine-stage").scrollIntoViewIfNeeded();
      if (state === "paused")
        await page
          .getByRole("button", { name: "Pause engine", exact: true })
          .press("Enter");
      await page.evaluate(() => {
        document.documentElement.dataset.recoveryVisit = "same-page";
      });

      await page.emulateMedia({ colorScheme: failedTheme });
      await expect(page.locator(".engine-art-error")).toBeVisible();
      await expect(page.locator(".jet-engine")).toHaveAttribute(
        "data-playing",
        "false",
      );
      await expect(page.locator(".engine-play")).toBeDisabled();

      await page.emulateMedia({ colorScheme: theme });
      await expect
        .poll(() =>
          page
            .locator(".engine-rear")
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
      await expect(page.locator(".engine-art-error")).toHaveCount(0);
      await expect(drawing).toBeVisible();
      await expect(page.locator(".jet-engine")).toHaveAttribute(
        "data-thrust",
        "reverse",
      );
      await expect(page.locator("#engine-speed")).toHaveValue("60");
      await expect(page.locator("html")).toHaveAttribute(
        "data-recovery-visit",
        "same-page",
      );
      await expect(page).toHaveURL("/?recovery=art#jet-engine");
      await page.locator(".engine-stage").scrollIntoViewIfNeeded();
      await expect(page.locator(".jet-engine")).toHaveAttribute(
        "data-playing",
        String(state === "playing"),
      );
      const feedback = page.locator(".engine-feedback");
      await expect(feedback).toContainText(
        state === "playing"
          ? "Running at a 60% setting"
          : state === "paused"
            ? "Paused at 60%"
            : state === "reduced"
              ? "Reduced motion is on"
              : "Canvas animation is unavailable",
      );
      if (state === "reduced" || state === "fallback")
        await expect(page.locator(".engine-play")).toBeDisabled();
      else await expect(page.locator(".engine-play")).toBeEnabled();
    });
