import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`${theme} rain plays automatically through translucent sections`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const backdrop = page.locator(".matrix-backdrop");
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    await expect(backdrop).toHaveCSS("pointer-events", "none");
    await expect(backdrop).toHaveCSS("position", "fixed");
    await expect(backdrop).toHaveAttribute("data-renderer", "canvas");
    await expect(backdrop).toHaveAttribute("data-playing", "true");
    await expect(page.locator(".background-toggle")).toHaveCount(0);
    await expect(page.locator(".matrix-still")).not.toBeVisible();
    await expect
      .poll(async () => Number(await backdrop.getAttribute("data-boundaries")))
      .toBeGreaterThan(0);
    const clock = () => backdrop.getAttribute("data-time");
    const before = await clock();
    await expect.poll(clock).not.toBe(before);
    for (const selector of ["#resume", "#contact", ".intro-copy"]) {
      const background = await page
        .locator(selector)
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(background).toMatch(/^rgba\(/);
    }
    const links = await page
      .locator("#main-navigation a")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().y),
      );
    expect(new Set(links).size).toBe(1);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .press("Enter");
    await expect(page.locator("#contact")).toBeFocused();
    await expect(backdrop).toHaveAttribute("data-playing", "true");
  });

  test(`${theme} reduced motion keeps a still field and mobile keyboard navigation`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const backdrop = page.locator(".matrix-backdrop");
    await expect(backdrop).toHaveAttribute("data-playing", "false");
    const drawing = page.locator(".matrix-canvas");
    const pixels = () =>
      drawing.evaluate((node: HTMLCanvasElement) => node.toDataURL());
    const before = await pixels();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await pixels()).toBe(before);
    await page.evaluate(() =>
      localStorage.setItem("portfolio-motion", "reduce"),
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await expect(backdrop).toHaveAttribute("data-playing", "false");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await menu.press("Enter");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Experience", exact: true })
      .press("Enter");
    await expect(page.locator("#resume")).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });
}

test("hidden tabs suspend rain and returning resumes automatically", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const backdrop = page.locator(".matrix-backdrop");
  await expect(backdrop).toHaveAttribute("data-playing", "true");
  for (const hidden of [true, false]) {
    await page.evaluate((value) => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => value,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
    await expect(backdrop).toHaveAttribute("data-playing", String(!hidden));
  }
});

test("without JavaScript a static field and navigation remain", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".matrix-still")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#main-navigation a")).toHaveCount(4);
  } finally {
    await context.close();
  }
});

test("canvas denial preserves the static fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof native>
    ) {
      if (this.classList.contains("matrix-canvas")) return null;
      return native.apply(this, args);
    } as typeof native;
  });
  await page.goto("/");
  await expect(page.locator(".matrix-still")).toBeVisible();
  await expect(page.locator(".background-toggle")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
