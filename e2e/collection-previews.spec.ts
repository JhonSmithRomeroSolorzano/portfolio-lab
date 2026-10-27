import { expect, test } from "@playwright/test";
import { experiences } from "../src/features/playground/catalog";

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    test(`static lab previews explain the work at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      const optional: string[] = [];
      page.on("request", (request) => {
        if (
          /\/(JetEngine|GravityLoom|SignalSculpture|MotionStudio|RoutePuzzle|CacheRescue|AlgorithmGarden)-.*\.js/.test(
            request.url(),
          )
        )
          optional.push(request.url());
      });
      await page.goto("/#collection");
      await expect(page.locator(".identity-rail")).toHaveAttribute(
        "data-menu-ready",
        "true",
      );
      const cards = page.locator(".collection-card");
      await expect(cards).toHaveCount(7);
      await expect(cards.first().locator("img")).toBeInViewport();
      expect(optional).toEqual([]);
      for (const [index, experience] of experiences.entries()) {
        const card = cards.nth(index);
        await expect(card.locator(".collection-descriptor")).toHaveText(
          experience.descriptor,
        );
        await expect(card.locator(".collection-description")).toHaveText(
          experience.description,
        );
        const image = card.locator("img");
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (node: HTMLImageElement) =>
                node.complete &&
                node.naturalWidth === 480 &&
                node.naturalHeight === 300,
            ),
          )
          .toBe(true);
        await expect(image).toHaveAttribute("alt", "");
        await expect(image).toHaveAttribute("loading", "lazy");
        await expect(card).toHaveAttribute("href", `#${experience.id}`);
      }
      for (const size of ["100%", "200%"]) {
        await page.setViewportSize({ width: 320, height: 900 });
        await page.evaluate((value) => {
          document.documentElement.style.fontSize = value;
        }, size);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await cards.evaluateAll((nodes) =>
            nodes.every((node) => node.scrollWidth <= node.clientWidth),
          ),
        ).toBe(true);
      }
    });
  }
}

test("collection previews and descriptors are useful without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/#collection");
    const card = page.locator(".collection-card").first();
    await expect(card.locator(".collection-descriptor")).toHaveText(
      experiences[0].descriptor,
    );
    await expect
      .poll(() =>
        card
          .locator("img")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(480);
    await expect(page.locator('#main-navigation a[href="#resume"]')).toHaveText(
      "↗ Experience",
    );
  } finally {
    await context.close();
  }
});
