import { expect, test, type Page } from "@playwright/test";

async function expectConnected(page: Page) {
  await expect(async () => {
    const result = await page.locator(".map-wires").evaluate((element) => {
      const svg = element as SVGSVGElement;
      const bounds = document
        .querySelector(".map-topology")!
        .getBoundingClientRect();
      const front = document
        .querySelector(".stack-node-frontend")!
        .getBoundingClientRect();
      const back = document
        .querySelector(".stack-node-backend")!
        .getBoundingClientRect();
      const path = svg.querySelector<SVGPathElement>(".map-wire")!;
      const start = path.getPointAtLength(0);
      // The first path segment ends at the backend's left edge.
      return {
        view: [svg.viewBox.baseVal.width, svg.viewBox.baseVal.height],
        bounds: [bounds.width, bounds.height],
        start: [start.x, start.y],
        expected: [
          front.right - bounds.left,
          front.top + front.height / 2 - bounds.top,
        ],
        first: path.getAttribute("d")!.split("M")[1],
        backendLeft: back.left - bounds.left,
      };
    });
    result.view.forEach((v, i) => expect(v).toBeCloseTo(result.bounds[i], 1));
    result.start.forEach((v, i) =>
      expect(v).toBeCloseTo(result.expected[i], 1),
    );
    expect(Number(result.first.split("H")[1])).toBeCloseTo(
      result.backendLeft,
      1,
    );
  }).toPass({ timeout: 5000 });
}

for (const theme of ["light", "dark"] as const) {
  test(`stack connections follow viewport reflow without ResizeObserver in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      Object.defineProperty(window, "ResizeObserver", {
        value: undefined,
        configurable: true,
      });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await page.locator(".stack-node-data").click();
    await expectConnected(page);
    for (const width of [390, 844, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectConnected(page);
      await expect(page.locator(".stack-node-data")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  });
}
