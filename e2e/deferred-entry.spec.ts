import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`a direct lab link keeps its heading onscreen after layout settles (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/#gravity-loom");
    await expect(page.locator(".loom-stage")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Observe the settled landing, not an intermediate frame before WebKit's
    // deferred focus/scroll adjustment and neighboring chunks finish rendering.
    await page.waitForTimeout(300);
    await expect(page.locator("#gravity-loom")).toBeFocused();
    await expect(page.locator("#loom-title")).toBeInViewport({ ratio: 1 });
  });
}

for (const browseAway of [false, true]) {
  test(`a delayed neighboring lab ${browseAway ? "respects the visitor scrolling away" : "preserves the selected landing"}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route("**/JetEngine-*.js", async (route) => {
      requested = true;
      await pending;
      await route.continue();
    });
    await page.goto("/#gravity-loom", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".loom-stage")).toBeVisible();
    await expect.poll(() => requested).toBe(true);
    if (browseAway) {
      // Scroll the experience, not the independently scrollable identity rail
      // at the mouse's default (0, 0) position.
      await page.locator("#loom-title").hover();
      await page.mouse.wheel(0, -20000);
      await expect(page.locator("#workbench")).toBeInViewport();
    }
    release();
    await expect(page.locator(".jet-engine")).toBeVisible();
    await page.waitForTimeout(300);
    await expect(
      page.locator(browseAway ? "#workbench" : "#loom-title"),
    ).toBeInViewport();
  });
}
