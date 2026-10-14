import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("sculpture is explicit, transforms without resetting playback, pulses, pauses and resets", async ({
  page,
}) => {
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  const stage = exhibit.locator(".sculpture-stage");
  await expect(
    exhibit.getByRole("heading", { name: "Signal Sculpture." }),
  ).toBeVisible();
  await expect(stage).toHaveAttribute("data-playing", "false");
  const pixels = () =>
    exhibit
      .locator("canvas")
      .evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  const initial = await pixels();
  await exhibit
    .getByRole("button", { name: "Play", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-playing", "true");
  // The monogram itself rotates before any shape change or pulse.
  await expect.poll(pixels).not.toBe(initial);
  await exhibit
    .getByRole("button", { name: "Ribbon", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-form", "ribbon");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect.poll(pixels).not.toBe(initial);
  await exhibit.getByRole("button", { name: "Pulse", exact: true }).click();
  await expect(exhibit.getByRole("status")).toContainText("Pulse sent");
  await exhibit.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(stage).toHaveAttribute("data-playing", "false");
  const paused = await pixels();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await pixels()).toBe(paused);
  await exhibit.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(stage).toHaveAttribute("data-form", "monogram");
});

test("hidden document stops the actual canvas clock and returning waits for Play", async ({
  page,
}) => {
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(exhibit.locator(".sculpture-stage")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeEnabled();
  await expect(exhibit.locator(".sculpture-stage")).toHaveAttribute(
    "data-playing",
    "false",
  );
});

test("navigation, offscreen and reduced motion stop playback and returning never autoplays", async ({
  page,
}) => {
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  const stage = exhibit.locator(".sculpture-stage");
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page
    .locator('nav[aria-label="Main navigation"] a[href="#resume"]')
    .click();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator("#resume").scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await exhibit.scrollIntoViewIfNeeded();
  await exhibit.getByRole("button", { name: "Play", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-playing", "false");
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await exhibit
    .getByRole("button", { name: "Orbit", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText(
    "Orbit displayed without animation",
  );
});

test("canvas denial retains selectable static sculpture forms", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  await expect(exhibit.locator(".sculpture-stage svg")).toBeVisible();
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await exhibit.getByRole("button", { name: "Ribbon", exact: true }).click();
  await expect(exhibit.getByRole("status")).toContainText(
    "Ribbon shown as a static illustration",
  );
});

test("200 percent default text remains readable on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#signal-sculpture");
  await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
  const exhibit = page.locator("#signal-sculpture");
  await exhibit
    .getByRole("button", { name: "Ribbon", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText("Ribbon displayed");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [320, 1440]) {
    test(`sculpture reflows at ${width}px in ${theme} with static accessible controls`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/#signal-sculpture");
      const exhibit = page.locator("#signal-sculpture");
      await expect(
        exhibit.getByRole("button", { name: "Orbit", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const name of ["Monogram", "Ribbon", "Orbit"]) {
        await exhibit.getByRole("button", { name, exact: true }).click();
        await expect(
          exhibit.getByRole("button", { name, exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (await new AxeBuilder({ page }).include("#signal-sculpture").analyze())
          .violations,
      ).toEqual([]);
      await exhibit.screenshot({
        path: `artifacts/signal-sculpture-${theme}-${width}.png`,
      });
    });
  }
