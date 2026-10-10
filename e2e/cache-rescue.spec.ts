import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("cache rescue gives a playable result for each strategy and all three challenges", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#cache-rescue");
  const send = page.getByRole("button", { name: "Send & see the result" });
  await send.press("Enter");
  await expect(page.locator(".cache-feedback")).toContainText(
    "24 database reads",
  );
  await page.getByRole("button", { name: /Share one fetch/ }).press("Enter");
  await expect(page.locator(".cache-feedback")).toContainText(
    "Choose a strategy",
  );
  await send.press("Enter");
  await expect(page.locator(".cache-feedback")).toContainText(
    "23 duplicate reads",
  );
  await page.getByRole("button", { name: /Next challenge/ }).click();
  await expect(send).toBeFocused();
  await send.click();
  await expect(page.locator(".cache-feedback")).toContainText(
    "15 duplicate reads",
  );
  await page.getByRole("button", { name: /Next challenge/ }).click();
  await send.click();
  await expect(page.locator(".cache-feedback")).toContainText(
    "both strategies need only one read",
  );
  await page.getByRole("button", { name: /Everyone fetches/ }).click();
  await send.click();
  await expect(page.locator(".cache-feedback")).toContainText(
    "12 replies, one database read",
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".cache-feedback")).toContainText(
    "Choose a strategy",
  );
});

test("cache playback is explicit, pausable and stops on navigation or reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#cache-rescue");
  await expect(
    page.getByRole("button", { name: /Send the crowd/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Send the crowd/ }).click();
  await page.getByRole("button", { name: "Pause the rush" }).click();
  const paused = await page.locator(".cache-stage").getAttribute("aria-label");
  await page.waitForTimeout(250);
  await expect(page.locator(".cache-stage")).toHaveAttribute(
    "aria-label",
    paused!,
  );
  await page.getByRole("button", { name: "Resume the rush" }).click();
  await page
    .getByRole("navigation", { name: "Explore the collection" })
    .getByRole("link", { name: /Connection puzzle/ })
    .press("Enter");
  await expect(page.locator(".cache-game")).not.toHaveClass(/is-playing/);
  await page
    .getByRole("navigation", { name: "Explore the collection" })
    .getByRole("link", { name: /Cache Rescue/ })
    .press("Enter");
  await page.getByRole("button", { name: "Resume the rush" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cache-game")).not.toHaveClass(/is-playing/);
  await expect(
    page.getByRole("button", { name: "Send & see the result" }),
  ).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`new games fit 320px and pass automated accessibility checks in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#cache-rescue");
    await page.getByRole("button", { name: "Send & see the result" }).click();
    await page.getByText("Why does this work?", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Explore the collection" })
      .getByRole("link", { name: /Algorithm Garden/ })
      .press("Enter");
    await page.getByRole("button", { name: "Hint the next node" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const result = await new AxeBuilder({ page })
      .include("#cache-rescue")
      .include("#algorithm-garden")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}
