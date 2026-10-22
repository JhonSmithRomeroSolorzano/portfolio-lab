import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function chooseMotion(page: Page, reduced: boolean) {
  const settings = page.locator(".motion-settings");
  if (!(await settings.evaluate((node: HTMLDetailsElement) => node.open))) {
    await settings.locator("summary").press("Enter");
  }
  const radio = settings.getByRole("radio", {
    name: reduced ? "Reduce animation" : "Follow device",
  });
  await radio.check();
  await radio.press("Escape");
}

test("motion preference persists, synchronizes tabs, and never overrides device reduction", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await chooseMotion(page, true);
  await page.locator(".stack-drawing").scrollIntoViewIfNeeded();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.locator(".stack-drawing")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(
    page.getByText("Browser → API → data → browser", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-motion-preference",
    "reduce",
  );
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  const second = await context.newPage();
  await second.goto("/");
  await chooseMotion(second, false);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await chooseMotion(page, true);
  await chooseMotion(page, false);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await second.close();
});

test("blocked storage keeps the motion choice usable for the current visit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");
  await chooseMotion(page, true);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.locator(".motion-settings summary").press("Enter");
  await expect(page.locator(".motion-settings [role=status]")).toContainText(
    "Applied for this visit",
  );
  await chooseMotion(page, false);
  await expect(page.locator("html")).toHaveAttribute(
    "data-motion-preference",
    "system",
  );
});

for (const exhibit of [
  {
    id: "jet-engine",
    stage: ".engine-stage",
    state: ".jet-engine",
    play: "Play engine",
    pause: "Pause engine",
  },
  {
    id: "gravity-loom",
    stage: ".loom-stage",
    state: ".loom-stage",
    play: "Play",
    pause: "Pause",
  },
  {
    id: "signal-sculpture",
    stage: ".sculpture-stage",
    state: ".sculpture-stage",
    play: "Play",
    pause: "Pause",
  },
]) {
  test(`site motion preference freezes ${exhibit.id} and preserves its manual pause`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/#${exhibit.id}`);
    const section = page.locator(`#${exhibit.id}`);
    const state = section.locator(exhibit.state);
    const stage = section.locator(exhibit.stage);
    await expect(state).toHaveAttribute("data-playing", "true");
    await chooseMotion(page, true);
    await stage.scrollIntoViewIfNeeded();
    await expect(state).toHaveAttribute("data-playing", "false");
    await expect(
      section.getByRole("button", { name: exhibit.play, exact: true }),
    ).toBeDisabled();
    const frame = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
    const pixels = () =>
      section
        .locator("canvas")
        .evaluate((node: HTMLCanvasElement) => node.toDataURL());
    await frame();
    const still = await pixels();
    await frame();
    expect(await pixels()).toBe(still);
    await chooseMotion(page, false);
    await stage.scrollIntoViewIfNeeded();
    await expect(state).toHaveAttribute("data-playing", "true");
    await section
      .getByRole("button", { name: exhibit.pause, exact: true })
      .press("Enter");
    await chooseMotion(page, true);
    await chooseMotion(page, false);
    await stage.scrollIntoViewIfNeeded();
    await expect(state).toHaveAttribute("data-playing", "false");
  });
}

test("explicit-run labs retain useful static outcomes under the site preference", async ({
  page,
}) => {
  await page.goto("/");
  await chooseMotion(page, true);
  await page.goto("/#motion-studio");
  await page.getByRole("button", { name: "Show end state" }).press("Enter");
  await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(2);
  expect(
    await page
      .locator(".motion-runner")
      .evaluateAll((nodes) =>
        nodes.every((node) => node.getAnimations().length === 0),
      ),
  ).toBe(true);
  await page.goto("/#cache-rescue");
  await page.getByRole("button", { name: /Send.*result/ }).press("Enter");
  await expect(page.locator(".cache-feedback")).toBeVisible();
});

for (const theme of ["light", "dark"]) {
  test(`motion settings remain keyboard reachable at 320px and 200% text in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/");
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    await page.locator(".motion-settings summary").press("Enter");
    const panel = page.locator(".motion-settings-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("p").last()).toBeInViewport({ ratio: 1 });
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .include(".motion-settings")
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.getByRole("radio", { name: "Reduce animation" }).press("Space");
    await page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(page.locator(".motion-settings summary")).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await page.locator(".motion-settings summary").press("Enter");
    await page.getByRole("radio", { name: "Reduce animation" }).focus();
    await page.keyboard.press("Tab");
    await expect(panel).not.toBeVisible();
    expect(
      await page
        .locator(".motion-settings")
        .evaluate((node) => node.contains(document.activeElement)),
    ).toBe(false);
  });
}
