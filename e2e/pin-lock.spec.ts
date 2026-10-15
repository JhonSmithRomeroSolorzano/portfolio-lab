import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LOCKS } from "../src/domain/playground/pin-lock";

async function setPin(page: Page, index: number, level: number) {
  const slider = page.getByRole("slider", {
    name: `Pin ${index + 1} height`,
    exact: true,
  });
  await slider.press("Home");
  for (let i = 0; i < level; i++) await slider.press("ArrowRight");
}

test("pin controls visibly move the mechanism, blocked attempts fail, and every cut opens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#pin-lock");
  const pin = page.locator('[data-part="pin-1"]');
  const initial = (await pin.boundingBox())!;
  await page.getByRole("button", { name: "Pull the bolt →" }).press("Enter");
  await expect(page.locator(".lock-feedback")).toContainText("Jammed");
  await expect(page.locator(".lock-lower.is-blocking")).toHaveCount(5);
  await setPin(page, 0, 2);
  expect((await pin.boundingBox())!.y).toBeLessThan(initial.y - 10);
  for (const lock of LOCKS) {
    await page.getByRole("button", { name: lock.name, exact: true }).click();
    for (let i = 0; i < 5; i++) await setPin(page, i, lock.cuts[i]);
    await expect(page.locator(".lock-feedback")).toContainText(
      "All five joins",
    );
    const bolt = page.locator('[data-part="bolt"]');
    const closed = (await bolt.boundingBox())!;
    await page.getByRole("button", { name: "Pull the bolt →" }).press("Enter");
    await expect(bolt).toHaveAttribute("data-open", "true");
    expect((await bolt.boundingBox())!.x).toBeGreaterThan(closed.x + 35);
    await expect(
      page.getByRole("slider", { name: "Pin 1 height" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: lock.name, exact: true })
      .press("Enter");
    await expect(bolt).toHaveAttribute("data-open", "true");
    await page.getByRole("button", { name: "Relock the bolt" }).press("Enter");
    await expect(bolt).toHaveAttribute("data-open", "false");
  }
  const cover = page.locator('[data-part="cover"]');
  const before = (await cover.boundingBox())!;
  await page
    .getByRole("slider", { name: "Lift the cover", exact: true })
    .press("End");
  expect((await cover.boundingBox())!.y).toBeLessThan(before.y - 30);
});

test("direct dragging preserves the grab offset and releases on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#pin-lock");
  const pin = page.locator('[data-part="pin-1"] .lock-pin-hit');
  await pin.scrollIntoViewIfNeeded();
  const box = (await pin.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height * 0.7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(page.getByRole("slider", { name: "Pin 1 height" })).toHaveValue(
    "0",
  );
  await page.mouse.move(x, y - 45, { steps: 8 });
  await expect(
    page.getByRole("slider", { name: "Pin 1 height" }),
  ).not.toHaveValue("0");
  await page.mouse.up();
  await expect(page.locator(".pin-lock")).not.toHaveClass(/is-dragging/);
  const moved = (await pin.boundingBox())!;
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
  await page.mouse.down();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  await expect(page.locator(".pin-lock")).not.toHaveClass(/is-dragging/);
  await page.mouse.up();
});

test.describe("narrow touch controls", () => {
  test.use({ hasTouch: true });
  for (const theme of ["light", "dark"] as const)
    test(`touch buttons and enlarged text work in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/#pin-lock");
      await page.locator(".pin-lock").waitFor();
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      await page
        .getByRole("button", { name: "Raise pin 1", exact: true })
        .tap();
      await expect(
        page.getByRole("slider", { name: "Pin 1 height" }),
      ).toHaveValue("1");
      await page.getByRole("button", { name: "Pin 5", exact: true }).tap();
      await page
        .getByRole("button", { name: "Raise pin 5", exact: true })
        .tap();
      await expect(
        page.getByRole("slider", { name: "Pin 5 height" }),
      ).toHaveValue("5");
      await expect(page.locator('[data-part="pin-5"]')).toHaveAttribute(
        "data-level",
        "5",
      );
      await page.getByRole("button", { name: "Pull the bolt →" }).tap();
      await expect(page.locator(".lock-feedback")).toContainText("Jammed");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const result = await new AxeBuilder({ page })
        .include("#pin-lock")
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
