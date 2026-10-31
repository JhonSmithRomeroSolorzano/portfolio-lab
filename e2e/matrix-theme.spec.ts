import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`${theme} has page-wide falling katakana, a new top menu, and a working background pause`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const backdrop = page.locator(".matrix-backdrop");
    const drawing = page.locator(".matrix-canvas");
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    await expect(backdrop).toHaveCSS("pointer-events", "none");
    await expect(backdrop).toHaveCSS("position", "fixed");
    await expect(backdrop).toHaveAttribute("data-paused", "false");
    await expect(backdrop).toHaveAttribute("data-renderer", "canvas");
    await expect(backdrop).toHaveAttribute("data-playing", "true");
    await expect(page.locator(".matrix-still")).not.toBeVisible();
    await expect
      .poll(async () => Number(await backdrop.getAttribute("data-boundaries")))
      .toBeGreaterThan(0);
    await expect(
      page.locator(".console-session, .rail-caption, .rail-brand .brand-mark"),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Jhon Smith Romero.",
    );
    const bounds = await backdrop.boundingBox();
    expect(bounds!.width).toBe(1440);
    expect(bounds!.height).toBe(1000);
    const links = await page
      .locator("#main-navigation a")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        }),
      );
    expect(new Set(links.map((link) => link.y)).size).toBe(1);
    expect(links[3].x).toBeGreaterThan(links[0].x);
    const clock = () => backdrop.getAttribute("data-time");
    const before = await clock();
    await expect.poll(clock).not.toBe(before);
    await page
      .getByRole("button", { name: "Pause background", exact: true })
      .click();
    await expect(backdrop).toHaveAttribute("data-playing", "false");
    const paused = await clock();
    const still = await drawing.evaluate((node: HTMLCanvasElement) =>
      node.toDataURL(),
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      await drawing.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
    ).toBe(still);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .press("Enter");
    await expect(page.locator("#contact")).toBeFocused();
    expect(await clock()).toBe(paused);
    await page
      .getByRole("button", { name: "Resume background", exact: true })
      .click();
    await expect.poll(clock).not.toBe(paused);
  });

  test(`${theme} background is static with device or site motion reduction and the mobile menu is usable`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const backdrop = page.locator(".matrix-backdrop");
    await expect(backdrop).toHaveAttribute("data-playing", "false");
    await expect(
      page.getByRole("button", { name: "Background animation reduced" }),
    ).toBeDisabled();
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
    const experience = page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Experience", exact: true });
    await expect(experience).toBeVisible();
    await experience.press("Enter");
    await expect(page.locator("#resume")).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });
}

test("hidden tabs suspend the rain and returning does not undo a manual pause", async ({
  page,
}) => {
  await page.goto("/");
  const backdrop = page.locator(".matrix-backdrop");
  await expect(backdrop).toHaveAttribute("data-paused", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(backdrop).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(backdrop).toHaveAttribute("data-playing", "true");
  await page
    .getByRole("button", { name: "Pause background", exact: true })
    .click();
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(backdrop).toHaveAttribute("data-playing", "false");
});

test("the page keeps a static character backdrop without JavaScript", async ({
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

test("canvas denial keeps a static field and the portfolio usable", async ({
  page,
}) => {
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
  await expect(
    page.getByRole("button", { name: "Static background" }),
  ).toBeDisabled();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
