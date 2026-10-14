import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("touch placement", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 1000 } });
  test("a phone can tap the field and use placement buttons without autoplay", async ({
    page,
  }) => {
    await page.goto("/#gravity-loom");
    const exhibit = page.locator("#gravity-loom");
    await exhibit.locator(".loom-stage").tap({ position: { x: 100, y: 120 } });
    await expect(exhibit.getByRole("status")).toContainText("3 attractors");
    await exhibit
      .getByRole("button", { name: "Add attractor", exact: true })
      .tap();
    await expect(
      exhibit.getByRole("button", { name: "Add attractor", exact: true }),
    ).toBeDisabled();
    await expect(exhibit.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "false",
    );
  });
});

test("loom plays, preserves paused trails, changes flow and resets through keyboard controls", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const stage = exhibit.locator(".loom-stage");
  const pixels = () =>
    exhibit
      .locator("canvas")
      .evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await expect(
    exhibit.getByRole("heading", { name: "Gravity Loom." }),
  ).toBeVisible();
  await expect(stage).toHaveAttribute("data-playing", "false");
  const initial = await pixels();
  await exhibit
    .getByRole("button", { name: "Play", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect.poll(pixels).not.toBe(initial);
  await exhibit
    .getByRole("button", { name: "Pause", exact: true })
    .press("Enter");
  const paused = await pixels();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await pixels()).toBe(paused);
  await exhibit
    .getByRole("button", { name: "Orbit", exact: true })
    .press("Enter");
  expect(await pixels()).toBe(paused);
  await exhibit
    .getByRole("button", { name: "Play", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await exhibit
    .getByRole("button", { name: "Weave", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-flow", "weave");
  await exhibit
    .getByRole("slider", { name: "Flow strength" })
    .press("ArrowRight");
  await expect(
    exhibit.getByRole("slider", { name: "Flow strength" }),
  ).toHaveValue("110");
  await exhibit
    .getByRole("button", { name: "Reset", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-flow", "orbit");
  await expect(stage).toHaveAttribute("data-playing", "false");
  await expect(
    exhibit.getByRole("slider", { name: "Flow strength" }),
  ).toHaveValue("100");
});

test("buttons and field placement respect attractor bounds without autoplay", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  await exhibit.getByLabel("Attractor placement").selectOption("1");
  await exhibit
    .getByRole("button", { name: "Add attractor", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText("3 attractors");
  await exhibit.locator(".loom-stage").click({ position: { x: 90, y: 90 } });
  await expect(
    exhibit.getByRole("button", { name: "Add attractor", exact: true }),
  ).toBeDisabled();
  await exhibit.locator(".loom-stage").click({ position: { x: 70, y: 70 } });
  await expect(exhibit.getByRole("status")).toContainText(
    "Four attractors is the limit",
  );
  for (let i = 0; i < 4; i++)
    await exhibit
      .getByRole("button", { name: "Remove last", exact: true })
      .press("Enter");
  await expect(
    exhibit.getByRole("button", { name: "Remove last", exact: true }),
  ).toBeDisabled();
  await expect(exhibit.locator(".loom-stage")).toHaveAttribute(
    "data-playing",
    "false",
  );
});

test("navigation, hidden documents, offscreen changes and reduced motion stop the loom", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const stage = exhibit.locator(".loom-stage");
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page
    .locator('nav[aria-label="Main navigation"] a[href="#resume"]')
    .click();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.scrollIntoViewIfNeeded();
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator("#resume").scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.scrollIntoViewIfNeeded();
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-playing", "false");
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await exhibit.getByRole("button", { name: "Weave", exact: true }).click();
  await expect(exhibit.getByRole("status")).toContainText(
    "Static weave artwork",
  );
});

test("canvas denial retains a static woven drawing and working placement controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  await expect(exhibit.locator(".loom-stage svg")).toBeVisible();
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await exhibit
    .getByRole("button", { name: "Add attractor", exact: true })
    .click();
  await expect(exhibit.locator(".loom-stage svg circle")).toHaveCount(3);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [320, 1440]) {
    test(`loom fits ${width}px in ${theme} with accessible static controls`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/#gravity-loom");
      const exhibit = page.locator("#gravity-loom");
      await expect(
        exhibit.getByRole("button", { name: "Weave", exact: true }),
      ).toBeVisible();
      await exhibit
        .getByRole("button", { name: "Weave", exact: true })
        .press("Enter");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const placementBox = await exhibit
        .getByLabel("Attractor placement")
        .boundingBox();
      expect(placementBox?.height).toBeGreaterThanOrEqual(44);
      expect(
        (await new AxeBuilder({ page }).include("#gravity-loom").analyze())
          .violations,
      ).toEqual([]);
      await exhibit.screenshot({
        path: `artifacts/gravity-loom-${theme}-${width}.png`,
      });
      if (width === 320) {
        await page.addStyleTag({
          content: "html { font-size: 200% !important; }",
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    });
  }
