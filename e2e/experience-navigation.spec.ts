import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`lab return links stay readable and compact on phones in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    for (const width of [320, 390, 844]) {
      await page.setViewportSize({ width, height: 900 });
      for (const fontSize of ["100%", "200%"]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size;
        }, fontSize);
        for (const id of ["jet-engine", "cache-rescue", "algorithm-garden"]) {
          const nav = page.locator(`#${id} .experience-navigation`);
          await expect(nav.getByRole("link")).toHaveCount(1);
          const back = nav.getByRole("link", {
            name: "Back to labs ↑",
            exact: true,
          });
          expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          expect(
            await back.evaluate((node) => node.scrollWidth <= node.clientWidth),
          ).toBe(true);
          await expect(back).toHaveCSS("background-color", /^rgba\(/);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  });
}

test("every lab has one collection return link and no redundant neighbors", async ({
  page,
}) => {
  await page.goto("/");
  const navigation = page.locator(".experience-navigation");
  await expect(navigation).toHaveCount(7);
  await expect(
    page.locator(".experience-nav-previous, .experience-nav-next"),
  ).toHaveCount(0);
  for (const nav of await navigation.all()) {
    await expect(nav.getByRole("link")).toHaveCount(1);
    await expect(
      nav.getByRole("link", { name: "Back to labs ↑" }),
    ).toHaveAttribute("href", "#collection");
  }
});

test("keyboard return and history preserve native focus and URL context", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?review=wayfinding#cache-rescue");
  await page.locator("#cache-rescue .experience-nav-collection").press("Enter");
  await expect(page).toHaveURL(/\?review=wayfinding#collection$/);
  await expect(page.locator("#collection")).toBeFocused();
  await expect(page.locator("#collection")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/\?review=wayfinding#cache-rescue$/);
});

test("lab return links work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/?review=static#cache-rescue");
    await page
      .locator("#cache-rescue .experience-nav-collection")
      .press("Enter");
    await expect(page).toHaveURL(/\?review=static#collection$/);
    await expect(page.locator("#collection")).toBeInViewport();
  } finally {
    await context.close();
  }
});
