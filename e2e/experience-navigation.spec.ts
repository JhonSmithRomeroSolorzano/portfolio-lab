import { test, expect } from "@playwright/test";

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
