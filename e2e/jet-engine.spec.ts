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
    "true",
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
  await page.route("**/engine-back-light-*.svg", (route) =>
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
    page.getByRole("button", { name: "Pause engine", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator(".engine-rear")
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
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator(".engine-canvas")).toBeHidden();
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
  await expect(page.locator(".engine-canvas")).toBeVisible();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
});

for (const theme of ["light", "dark"] as const)
  test(`near fan faces remain visible and the shaft/casing hide far blades in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#jet-engine");
    await page.locator(".engine-canvas[data-spool]").waitFor();
    await page
      .locator("#jet-engine")
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await page
      .getByRole("slider", { name: "Engine speed", exact: true })
      .press("Home");
    await expect(page.locator(".engine-canvas")).toHaveAttribute(
      "data-phase",
      "0.000",
    );
    await expect
      .poll(() =>
        page
          .locator(".engine-rear")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBeTruthy();
    const samples = await page.locator(".engine-stage").evaluate((stage) => {
      const canvas = stage.querySelector<HTMLCanvasElement>("canvas")!,
        img = stage.querySelector<HTMLImageElement>("img")!;
      const composite = document.createElement("canvas");
      composite.width = canvas.width;
      composite.height = canvas.height;
      const ctx = composite.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvas, 0, 0);
      const sample = (x: number, y: number) => {
        const px = Math.floor(((x + 0.5) * canvas.width) / 1100),
          py = Math.floor(((y + 0.5) * canvas.height) / 480);
        return {
          paint: [...canvas.getContext("2d")!.getImageData(px, py, 1, 1).data],
          composite: [...ctx.getImageData(px, py, 1, 1).data],
        };
      };
      return { near: sample(311, 237), hidden: sample(591, 185) };
    });
    expect(samples.near.paint[3]).toBeGreaterThan(240);
    expect(samples.near.composite.slice(0, 3)).toEqual(
      samples.near.paint.slice(0, 3),
    );
    expect(samples.hidden.paint[3]).toBe(0);
  });

test("SVG-only fallback preserves the same near/far visibility", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-feedback")).toContainText(
    "Canvas animation is unavailable",
  );
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  const hits = await page.locator(".engine-fallback").evaluate((svg) => {
    const faces = [
      ...svg.querySelectorAll<SVGGeometryElement>(".engine-blade"),
    ];
    return {
      near: faces.some((face) =>
        face.isPointInFill(new DOMPoint(311.5, 237.5)),
      ),
      hidden: faces.some((face) =>
        face.isPointInFill(new DOMPoint(591.5, 185.5)),
      ),
    };
  });
  expect(hits).toEqual({ near: true, hidden: false });
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
