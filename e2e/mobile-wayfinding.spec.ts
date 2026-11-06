import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`keyboard dock controls use immediate scrolling before section navigation in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    await page.goto("/#gravity-loom");
    await expect(page.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "true",
    );
    // Establish keyboard modality, then exercise every control in the sticky row.
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "Menu", exact: true });
    for (const control of [
      toggle,
      page.getByRole("button", { name: /Switch to .* theme/ }),
      page.locator(".motion-settings summary"),
    ]) {
      await control.focus();
      expect(
        await control.evaluate((node) => node.matches(":focus-visible")),
      ).toBe(true);
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
    }
    await toggle.press("Enter");
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Experience", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#resume$/);
    await expect(page.locator("#resume")).toBeFocused();
    await expect(page.locator(".loom-stage")).not.toBeInViewport();
    await expect(page.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "false",
    );
  });

  for (const [width, height, textSize] of [
    [390, 844, 100],
    [320, 568, 200],
    [844, 390, 100],
    [844, 390, 200],
  ]) {
    test(`mobile dock remains reachable deep in the page in ${theme} at ${width}×${height}, ${textSize}% text`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/?review=wayfinding#gravity-loom");
      await expect(
        page.getByRole("button", { name: "Add attractor" }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      // Finish direct-entry ownership before checking a reader's navigation.
      await page.keyboard.press("Escape");
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}%`;
        document.querySelector("#gravity-loom")!.scrollIntoView();
      }, textSize);
      const header = page.locator(".identity-rail");
      const toggle = page.getByRole("button", { name: "Menu", exact: true });
      const tapMenu = async () => {
        const box = (await toggle.boundingBox())!;
        // Locator.click auto-scrolls before input; use an actual viewport tap
        // to verify the sticky control is reachable without scrolling first.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      };
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      await expect(header).toHaveCSS("position", "sticky");
      await expect(toggle).toBeInViewport({ ratio: 1 });
      const scroll = await page.evaluate(() => scrollY);
      expect(scroll).toBeGreaterThan(height * 2);
      const contentTop = await page
        .locator("#gravity-loom")
        .evaluate((node) => node.getBoundingClientRect().top);
      await tapMenu();
      await expect(nav.getByRole("link").first()).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
      expect(
        await page
          .locator("#gravity-loom")
          .evaluate((node) => node.getBoundingClientRect().top),
      ).toBeCloseTo(contentTop, 0);
      const menu = (await nav.boundingBox())!;
      expect(menu.y).toBeGreaterThanOrEqual(0);
      expect(menu.y + menu.height).toBeLessThanOrEqual(height - 8);
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
      await page.keyboard.press("Enter");
      await expect(nav.getByRole("link").first()).toBeFocused();
      // macOS WebKit uses Option+Tab to include links in keyboard traversal.
      const tab =
        browserName === "webkit" && process.platform === "darwin"
          ? "Alt+Tab"
          : "Tab";
      for (const link of await nav.getByRole("link").all()) {
        await expect(link).toBeFocused();
        // Viewport intersection alone cannot detect an opaque overlay covering focus.
        expect(
          await link.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const hit = document.elementFromPoint(
              box.left + box.width / 2,
              box.top + box.height / 2,
            );
            return hit === node || node.contains(hit);
          }),
        ).toBe(true);
        await page.keyboard.press(tab);
      }
      await expect(nav).not.toBeVisible();
      const afterTraversal = await page.evaluate(() => scrollY);
      await tapMenu();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(afterTraversal, 0);
      await toggle.press("Enter");
      await nav
        .getByRole("link", { name: "Contact", exact: true })
        .press("Enter");
      await expect(page).toHaveURL(/review=wayfinding#contact$/);
      await expect(page.locator("#contact")).toBeFocused();
      await expect(nav).not.toBeVisible();
      const dock = (await header.boundingBox())!;
      await expect
        .poll(() =>
          page
            .locator("#contact")
            .evaluate((node) => node.getBoundingClientRect().top),
        )
        .toBeGreaterThan(dock.y + dock.height);
      await page.keyboard.press(tab);
      const focused = page.locator(":focus");
      await expect(focused).toBeInViewport({ ratio: 1 });
      expect((await focused.boundingBox())!.y).toBeGreaterThan(
        dock.y + dock.height,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}
