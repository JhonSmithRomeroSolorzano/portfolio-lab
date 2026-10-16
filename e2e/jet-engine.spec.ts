import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function pixels(page: Page) {
  return page.locator(".engine-canvas").evaluate((node: HTMLCanvasElement) => {
    const data = node
      .getContext("2d")!
      .getImageData(0, 0, node.width, node.height).data;
    let blue = 0,
      orange = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 3] > 20) {
        if (data[i + 2] > data[i] + 55 && data[i + 2] > data[i + 1] + 15)
          blue++;
        if (data[i] > data[i + 2] + 55) orange++;
      }
    return { blue, orange, image: node.toDataURL() };
  });
}
test("engine speed visibly changes airflow and fan motion, while pause freezes actual canvas pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas[data-spool]").waitFor();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page.getByRole("button", { name: /^Idle 25%/ }).click();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const phase = await page.locator(".engine-canvas").getAttribute("data-phase");
  await expect
    .poll(() => page.locator(".engine-canvas").getAttribute("data-phase"))
    .not.toBe(phase);
  await page.waitForTimeout(250);
  const low = await pixels(page);
  const flow = Number(
    await page.locator(".engine-canvas").getAttribute("data-flow"),
  );
  await page.getByRole("button", { name: /^Full power 100%/ }).click();
  await expect
    .poll(async () =>
      Number(await page.locator(".engine-canvas").getAttribute("data-spool")),
    )
    .toBeGreaterThan(97);
  const high = await pixels(page);
  expect(high.blue).toBeGreaterThan(low.blue * 1.2);
  expect(high.orange).toBeGreaterThan(low.orange * 1.2);
  expect(
    Number(await page.locator(".engine-canvas").getAttribute("data-flow")),
  ).toBeGreaterThan(flow * 2);
  expect(high.image).not.toBe(low.image);
  await page.getByRole("button", { name: "Pause engine", exact: true }).click();
  const paused = (await pixels(page)).image;
  await page.waitForTimeout(250);
  expect((await pixels(page)).image).toBe(paused);
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  await expect(page.locator(".engine-canvas")).toHaveAttribute(
    "data-flow",
    "0.000",
  );
  // A few anti-aliased metal-edge pixels can fall in the blue classification.
  expect((await pixels(page)).blue).toBeLessThan(low.blue * 0.05);
});

test("navigation, hidden tabs, scrolling away and reduced motion stop the engine without autoplay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#jet-engine");
  const engine = page.locator(".jet-engine");
  await page.getByRole("button", { name: /^Cruise 60%/ }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  await expect(engine).toHaveAttribute("data-playing", "false");
  await page.locator('.collection-index a[href="#jet-engine"]').press("Enter");
  await expect(engine).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Play engine", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(engine).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(engine).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Play engine", exact: true }).click();
  await page
    .getByRole("heading", { name: "Experience.", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(engine).toHaveAttribute("data-playing", "false");
  await page.locator('.collection-index a[href="#jet-engine"]').press("Enter");
  await page.getByRole("button", { name: "Play engine", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(engine).toHaveAttribute("data-playing", "false");
  await expect(
    page.getByRole("button", { name: "Play engine", exact: true }),
  ).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(engine).toHaveAttribute("data-playing", "false");
});

test("reduced-motion speed changes redraw a still composition instead of running a clock", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas[data-spool]").waitFor();
  await page.getByRole("button", { name: /^Idle 25%/ }).press("Enter");
  const low = await pixels(page);
  await page.getByRole("button", { name: /^Full power 100%/ }).press("Enter");
  const high = await pixels(page);
  expect(high.image).not.toBe(low.image);
  expect(high.blue).toBeGreaterThan(low.blue);
  await page.waitForTimeout(250);
  expect((await pixels(page)).image).toBe(high.image);
  await expect(page.locator(".engine-feedback")).toContainText(
    "Reduced motion is on",
  );
});

test("canvas denial keeps static engine parts and speed-dependent SVG air paths", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-fallback")).toBeVisible();
  const low = await page.locator(".fallback-cool").first().getAttribute("d");
  await page.getByRole("button", { name: /^Full power 100%/ }).press("Enter");
  await expect(page.locator(".fallback-cool").first()).not.toHaveAttribute(
    "d",
    low!,
  );
  await expect(
    page.getByRole("button", { name: "Play engine", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".engine-feedback")).toContainText(
    "Canvas animation is unavailable",
  );
});

test("failed casing artwork offers honest recovery without breaking career content", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/engine-front-light-*.svg", (route) =>
    fail
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.continue(),
  );
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-art-error")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Experience.", exact: true }),
  ).toHaveCount(1);
  fail = false;
  await page
    .locator(".engine-art-error")
    .getByRole("button", { name: "Reload page" })
    .click();
  await expect(page.locator(".engine-art-error")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play engine", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator(".engine-front")
        .evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
});

test("the former local lock anchor reaches the engine while retaining query context", async ({
  page,
}) => {
  await page.goto("/?source=example#pin-lock");
  await expect(page).toHaveURL(/\?source=example#jet-engine$/);
  await expect(
    page.getByRole("slider", { name: "Engine speed", exact: true }),
  ).toBeVisible();
});

test("the registered drawing reserves its geometry while casing assets are delayed", async ({
  page,
}) => {
  let release!: () => void,
    requested = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/engine-back-*.svg", async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto("/#jet-engine", { waitUntil: "domcontentloaded" });
  await expect.poll(() => requested).toBeTruthy();
  const stage = page.locator(".engine-stage");
  const before = (await stage.boundingBox())!;
  expect(before.height).toBeGreaterThan(100);
  expect(before.height / before.width).toBeCloseTo(480 / 1100, 2);
  release();
  await expect
    .poll(() =>
      page
        .locator(".engine-rear")
        .evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
  expect((await stage.boundingBox())!.height).toBeCloseTo(before.height, 0);
});

test.describe("responsive touch controls", () => {
  test.use({ hasTouch: true });
  for (const theme of ["light", "dark"] as const)
    test(`engine controls and static fallback reflow at 320px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/#jet-engine");
      await page.getByRole("button", { name: /^Full power 100%/ }).tap();
      await expect(
        page.getByRole("slider", { name: "Engine speed", exact: true }),
      ).toHaveValue("100");
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const result = await new AxeBuilder({ page })
        .include("#jet-engine")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.failureSummary),
        })),
      ).toEqual([]);
    });
});
