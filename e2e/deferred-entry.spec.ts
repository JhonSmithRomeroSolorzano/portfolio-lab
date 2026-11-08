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
      // Wheel deltas do not guarantee a scroll distance across engines. Use
      // successive gestures and observe the destination before releasing the
      // delayed download, keeping the scroll-interruption assertion intact.
      await expect(async () => {
        await page.mouse.wheel(0, -1000);
        await expect(page.locator("#workbench")).toBeInViewport({
          timeout: 250,
        });
      }).toPass({ timeout: 15_000, intervals: [100] });
    }
    release();
    await expect(page.locator(".jet-engine")).toBeVisible();
    await page.waitForTimeout(300);
    await expect(
      page.locator(browseAway ? "#workbench" : "#loom-title"),
    ).toBeInViewport();
  });
}

for (const theme of ["light", "dark"] as const)
  for (const reducedMotion of ["no-preference", "reduce"] as const)
    test(`a late neighboring lab preserves pointer hover in ${theme}, ${reducedMotion}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion });
      let release!: () => void;
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      let requested = false;
      await page.route("**/MotionStudio-*.js", async (route) => {
        requested = true;
        await pending;
        await route.continue();
      });
      try {
        await page.goto("/#signal-sculpture");
        const button = page
          .locator('.sculpture-forms button[aria-pressed="false"]')
          .first();
        await expect(button).toBeVisible();
        const colors = await button.evaluate((node) => {
          const probe = document.createElement("span");
          node.append(probe);
          const resolve = (token: string) => {
            probe.style.color = `var(${token})`;
            return getComputedStyle(probe).color;
          };
          const colors = {
            hover: resolve("--control-hover"),
            accent: resolve("--accent"),
          };
          probe.remove();
          return colors;
        });
        await button.hover();
        await expect(button).toHaveCSS("background-color", colors.hover);
        await expect(button).toHaveCSS("border-top-color", colors.accent);
        await expect.poll(() => requested).toBe(true);
        const before = await page.evaluate(() => ({
          y: scrollY,
          height: document.querySelector("main")!.getBoundingClientRect()
            .height,
        }));
        release();
        await expect(page.locator(".motion-studio")).toBeVisible();
        await expect
          .poll(() =>
            page
              .locator("main")
              .evaluate((node) => node.getBoundingClientRect().height),
          )
          .not.toBe(before.height);
        // Cross the resize-observer and its scheduled alignment frame before
        // checking hover; an immediate CSS assertion can miss the later jump.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        await expect(button).toHaveCSS("border-top-color", colors.accent);
        await expect(button).toHaveCSS("background-color", colors.hover);
        expect(await page.evaluate(() => scrollY)).toBe(before.y);
        await expect(page.locator("#signal-sculpture")).toBeFocused();
        await expect(page).toHaveURL("/#signal-sculpture");
      } finally {
        release();
      }
    });
