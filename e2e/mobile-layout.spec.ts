import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openMainNavigation } from "./helpers/main-navigation";

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
    await page.locator("h1").click();
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
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).not.toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: "Experience", exact: true }).click();
  await expect(page).toHaveURL(/#resume$/);
  await context.close();
});
