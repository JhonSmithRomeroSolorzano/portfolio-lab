import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("touch placement", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 1000 } });
  test("a phone tap directly pulls a point and starts the threads; controls add points", async ({
    page,
  }) => {
    await page.goto("/#gravity-loom");
    const exhibit = page.locator("#gravity-loom");
    await exhibit.locator(".loom-stage").tap({ position: { x: 100, y: 120 } });
    await expect(exhibit.getByRole("status")).toContainText("Point 1 moved");
    await expect(exhibit.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "true",
    );
    await exhibit
      .getByRole("button", { name: "Add attractor", exact: true })
      .tap();
    await exhibit
      .getByRole("button", { name: "Add attractor", exact: true })
      .tap();
    await expect(
      exhibit.getByRole("button", { name: "Add attractor", exact: true }),
    ).toBeDisabled();
  });
});

test("loom plays, preserves paused trails, changes flow and resets through keyboard controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
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
  await expect(stage).toHaveAttribute("data-playing", "true");
  const initial = await pixels();
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
    .getByRole("button", { name: "Weave", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-flow", "weave");
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

test("point controls respect attractor limits and a manual pause", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  await exhibit.getByRole("button", { name: "Pause", exact: true }).click();
  await exhibit.getByLabel("Attractor placement").selectOption("1");
  await exhibit
    .getByRole("button", { name: "Add attractor", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText("3 attractors");
  await exhibit
    .getByRole("button", { name: "Add attractor", exact: true })
    .press("Enter");
  await expect(
    exhibit.getByRole("button", { name: "Add attractor", exact: true }),
  ).toBeDisabled();
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

test("mouse dragging captures the pointer, moves the selected point and keeps the live field running", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const stage = exhibit.locator(".loom-stage");
  await expect(stage).toBeVisible();
  const box = await stage.boundingBox();
  if (!box) throw new Error("Missing field");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.mouse.move(x + 90, y + 40, { steps: 12 });
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await exhibit
    .getByText("Move a point without dragging", { exact: true })
    .click();
  await expect(exhibit.locator(".loom-fine-controls p")).not.toContainText(
    "horizontal -36%",
  );
  await stage.focus();
  await stage.press("Escape");
  await expect(stage).toHaveAttribute("data-playing", "false");
});

test("keyboard and single-click alternatives steer the same field, including reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const stage = exhibit.locator(".loom-stage");
  await stage.focus();
  await stage.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await exhibit
    .getByText("Move a point without dragging", { exact: true })
    .click();
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal -28%",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await exhibit
    .getByRole("button", { name: "Move right", exact: true })
    .press("Enter");
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal -18%",
  );
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.getByLabel("Attractor placement").selectOption("2");
  await exhibit.getByRole("button", { name: "Move here", exact: true }).click();
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal 50%",
  );
  await expect(stage).toHaveAttribute("data-playing", "false");
});

test("cancellation stops the field and hidden-tab interruption releases a drag", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const stage = page.locator("#gravity-loom .loom-stage");
  await expect(stage).toBeVisible();
  const box = await stage.boundingBox();
  if (!box) throw new Error("Missing field");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await stage.dispatchEvent("pointercancel", { pointerId: 1, isPrimary: true });
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await expect(stage).toHaveAttribute("data-playing", "false");
  await page.mouse.up();
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-playing", "true");
});

test("hidden tabs release a reduced-motion drag even when playback is already still", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#gravity-loom");
  const stage = page.locator("#gravity-loom .loom-stage");
  await expect(stage).toBeInViewport();
  const box = await stage.boundingBox();
  if (!box) throw new Error("Missing field");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await expect(stage).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-playing", "false");
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
