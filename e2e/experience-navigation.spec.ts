import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`lab wayfinding has ordered, readable rows on phones in ${theme}`, async ({
    page,
    browserName,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(
      (value) => localStorage.setItem("portfolio-theme", value),
      theme,
    );
    await page.goto("/");
    for (const width of [320, 390, 844]) {
      await page.setViewportSize({ width, height: 900 });
      for (const fontSize of ["100%", "200%"]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size;
        }, fontSize);
        for (const id of ["jet-engine", "cache-rescue", "algorithm-garden"]) {
          const nav = page.locator(`#${id} .experience-navigation`);
          const cards = await nav
            .locator("a:not(.experience-nav-collection)")
            .all();
          const back = await nav
            .locator(".experience-nav-collection")
            .boundingBox();
          const navBox = await nav.boundingBox();
          expect(back!.width).toBeCloseTo(navBox!.width, 0);
          for (const card of cards) {
            const box = await card.boundingBox();
            expect(box!.y + box!.height).toBeLessThanOrEqual(back!.y);
            expect(box!.height).toBeGreaterThanOrEqual(44);
            expect(
              await card.evaluate(
                (node) => node.scrollWidth <= node.clientWidth,
              ),
            ).toBe(true);
            if (cards.length === 1)
              expect(box!.width).toBeCloseTo(navBox!.width, 0);
          }
          const order = await nav
            .locator("a")
            .evaluateAll((nodes) => nodes.map((node) => node.className));
          expect(order.at(-1)).toBe("experience-nav-collection");
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
    const links = page.locator("#cache-rescue .experience-navigation a");
    await links.nth(0).focus();
    // macOS WebKit uses Option+Tab to include links in sequential navigation.
    const forward =
      browserName === "webkit" && process.platform === "darwin"
        ? "Alt+Tab"
        : "Tab";
    await page.keyboard.press(forward);
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press(forward);
    await expect(links.nth(2)).toBeFocused();
  });
}

test("each experience links to its actual neighbors and the collection without wrapping the ends", async ({
  page,
}) => {
  await page.goto("/");
  const ids = [
    "jet-engine",
    "gravity-loom",
    "signal-sculpture",
    "motion-studio",
    "connection-game",
    "cache-rescue",
    "algorithm-garden",
  ];
  for (const [index, id] of ids.entries()) {
    const nav = page.locator(`#${id} .experience-navigation`);
    for (const link of await nav.getByRole("link").all()) {
      const visibleName = (await link.innerText()).replace(/\s+/g, " ").trim();
      await expect(link).toHaveAccessibleName(visibleName);
    }
    await expect(
      nav.getByRole("link", { name: "Back to collection" }),
    ).toHaveAttribute("href", "#collection");
    if (index === 0)
      await expect(nav.locator(".experience-nav-previous")).toHaveCount(0);
    else
      await expect(nav.locator(".experience-nav-previous")).toHaveAttribute(
        "href",
        `#${ids[index - 1]}`,
      );
    if (index === ids.length - 1)
      await expect(nav.locator(".experience-nav-next")).toHaveCount(0);
    else
      await expect(nav.locator(".experience-nav-next")).toHaveAttribute(
        "href",
        `#${ids[index + 1]}`,
      );
  }
});

test("keyboard next, previous, collection, and history preserve native focus and URL context", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?review=wayfinding#cache-rescue");
  await page.locator("#cache-rescue .experience-nav-next").press("Enter");
  await expect(page).toHaveURL(/\?review=wayfinding#algorithm-garden$/);
  await expect(page.locator("#algorithm-garden")).toBeFocused();
  await page
    .locator("#algorithm-garden .experience-nav-previous")
    .press("Enter");
  await expect(page).toHaveURL(/#cache-rescue$/);
  await page.locator("#cache-rescue .experience-nav-collection").press("Enter");
  await expect(page).toHaveURL(/\?review=wayfinding#collection$/);
  await expect(page.locator("#collection")).toBeFocused();
  await expect(page.locator("#collection")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/#cache-rescue$/);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addStyleTag({ content: "html {font-size:200%}" });
  const links = await page
    .locator("#cache-rescue .experience-navigation a")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        height: node.getBoundingClientRect().height,
        fits: node.scrollWidth <= node.clientWidth + 1,
      })),
    );
  expect(links.every((link) => link.height >= 44 && link.fits)).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("experience wayfinding works without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/?review=static#cache-rescue");
  await page.locator("#cache-rescue .experience-nav-next").press("Enter");
  await expect(page).toHaveURL(/\?review=static#algorithm-garden$/);
  await page
    .locator("#algorithm-garden .experience-nav-collection")
    .press("Enter");
  await expect(page).toHaveURL(/#collection$/);
  await expect(page.locator("#collection")).toBeInViewport();
  await context.close();
});
