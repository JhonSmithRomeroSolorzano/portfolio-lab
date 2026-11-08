import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openMainNavigation } from "./helpers/main-navigation";

test("mobile hydration does not collapse an initially expanded menu or move content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  let release!: () => void;
  const entry = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/*.js", async (route) => {
    await entry;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    const header = page.locator(".identity-rail");
    await expect(header).toHaveAttribute("data-menu-ready", "false");
    await expect(header).toHaveCSS("position", "relative");
    await expect(page.locator("#main-navigation")).not.toBeVisible();
    const top = await page
      .locator(".portfolio-content")
      .evaluate((node) => node.getBoundingClientRect().top);
    release();
    await expect(header).toHaveAttribute("data-menu-ready", "true");
    await expect(header).toHaveCSS("position", "sticky");
    expect(
      await page
        .locator(".portfolio-content")
        .evaluate((node) => node.getBoundingClientRect().top),
    ).toBeCloseTo(top, 0);
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.locator("#main-navigation")).toBeVisible();
  } finally {
    release();
  }
});

test("failed mobile entry script restores native section links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#main-navigation")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page.locator("#contact")).toBeInViewport();
});

test("a mobile entry startup exception restores native keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/assets/index-*.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'throw new Error("Entry startup failed");',
    }),
  );
  await page.goto("/?review=startup");
  await expect(page.locator(".identity-rail")).toHaveAttribute(
    "data-menu-ready",
    "false",
  );
  await expect(page.locator("html")).not.toHaveAttribute("data-navigation");
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).toBeHidden();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "Contact", exact: true }).press("Enter");
  await expect(page).toHaveURL(/review=startup#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
  expect(errors).toEqual(["Entry startup failed"]);
});

for (const theme of ["light", "dark"] as const) {
  test(`mobile menu supports keyboard dismissal and native destinations in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(
      (value) => localStorage.setItem("portfolio-theme", value),
      theme,
    );
    await page.goto("/?review=mobile");
    const toggle = page.getByRole("button", { name: "Menu", exact: true });
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(toggle).toBeInViewport();
    await expect(toggle).toHaveText("");
    expect((await toggle.boundingBox())!.width).toBe(44);
    expect((await toggle.boundingBox())!.height).toBe(44);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore my experience" }),
    ).toHaveCount(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toBeFocused();
    await expect(nav).not.toBeVisible();
    await openMainNavigation(page);
    await expect(nav.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(nav).not.toBeVisible();

    await openMainNavigation(page);
    const audit = await new AxeBuilder({ page })
      .include(".identity-rail")
      .analyze();
    expect(audit.violations).toEqual([]);
    await nav
      .getByRole("link", { name: "Experience", exact: true })
      .press("Enter");
    await expect(page.locator("#resume")).toBeFocused();
    await expect(page).toHaveURL(/review=mobile#resume$/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    const role = page.locator(".experience-list > li").first();
    expect(
      await role.evaluate((node) => getComputedStyle(node).paddingLeft),
    ).toBe("0px");
    await expect(role.getByRole("link", { name: "Nimrod" })).toBeVisible();

    await openMainNavigation(page);
    await page.getByRole("button", { name: /Switch to .* theme/ }).focus();
    await expect(nav).not.toBeVisible();
    await openMainNavigation(page);
    // Tap the page gutter, outside the persistent dock and its dropdown.
    await page.mouse.click(8, 800);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test(`mobile menu reflows at narrow, enlarged and landscape sizes in ${theme}`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("portfolio-theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    for (const width of [320, 375, 600, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      for (const fontSize of ["100%", "200%"]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size;
        }, fontSize);
        await openMainNavigation(page);
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        for (const link of await page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link")
          .all()) {
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          expect(
            await link.evaluate((node) => node.scrollWidth <= node.clientWidth),
          ).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "Menu", exact: true }),
        ).toBeFocused();
        await expect(page.locator(".collection-card")).toHaveCount(7);
      }
    }
  });
}

test("desktop keeps visible navigation without a duplicate introduction action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).not.toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Explore my experience" }),
  ).toHaveCount(0);
  await nav
    .getByRole("link", { name: "Experience", exact: true })
    .press("Enter");
  await expect(page.locator("#resume")).toBeFocused();
});

test("mobile section links remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".identity-rail")).toHaveCSS(
    "position",
    "relative",
  );
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).not.toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "Experience", exact: true }).click();
  await expect(page).toHaveURL(/#resume$/);
  await context.close();
});
