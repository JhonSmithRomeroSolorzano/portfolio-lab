import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("machine and map preserve the same result, prediction, and keyboard focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#cache-rescue");
  const machine = page.getByRole("button", { name: "Machine", exact: true });
  const map = page.getByRole("button", { name: "Request map", exact: true });
  await expect(machine).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-request]")).toHaveCount(24);
  await expect(page.locator('[data-state="pending"]')).toHaveCount(24);
  await page.getByRole("button", { name: /Share one fetch/ }).press("Enter");
  await page.getByText("Predict before you play", { exact: true }).click();
  await page.getByLabel("How many database reads?").fill("1");
  await page
    .getByRole("button", { name: "Send & see the result" })
    .press("Enter");
  await expect(page.locator('[data-state="done"]')).toHaveCount(24);
  await expect(page.locator(".cache-press-readouts")).toContainText(
    "Origin reads1",
  );
  await expect(page.locator(".cache-press-footer")).toContainText(
    "MASTER READY",
  );
  await map.press("Enter");
  await expect(map).toBeFocused();
  await expect(page.locator(".cache-person.is-done")).toHaveCount(24);
  await expect(page.locator(".cache-feedback")).toContainText(
    "23 duplicate reads",
  );
  await machine.press("Enter");
  await expect(machine).toBeFocused();
  await expect(page.locator('[data-state="done"]')).toHaveCount(24);
  await expect(page.locator(".cache-prediction-result")).toHaveText(
    "You called it: 1 database read.",
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator('[data-state="pending"]')).toHaveCount(24);
});

test("press movement follows explicit playback and is stable while paused", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#cache-rescue");
  const head = page.locator('[data-part="press-head"]');
  const initial = await head.getAttribute("transform");
  await page.getByRole("button", { name: /Share one fetch/ }).click();
  await page.getByRole("button", { name: /Send the crowd/ }).click();
  await expect.poll(() => head.getAttribute("transform")).not.toBe(initial);
  await page.getByRole("button", { name: "Pause the rush" }).click();
  const paused = await head.getAttribute("transform");
  const cards = await page
    .locator(".press-cards")
    .evaluateAll((elements) =>
      elements.map((element) => element.innerHTML).join(""),
    );
  await page.waitForTimeout(250);
  await expect(head).toHaveAttribute("transform", paused!);
  expect(
    await page
      .locator(".press-cards")
      .evaluateAll((elements) =>
        elements.map((element) => element.innerHTML).join(""),
      ),
  ).toBe(cards);
  await page.getByRole("button", { name: "Request map", exact: true }).click();
  await page.getByRole("button", { name: "Machine", exact: true }).click();
  await expect(head).toHaveAttribute("transform", paused!);
  await page.getByRole("button", { name: "Resume the rush" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cache-game")).not.toHaveClass(/is-playing/);
});

for (const theme of ["light", "dark"] as const) {
  test(`press is readable at 320px with enlarged text in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#cache-rescue");
    await page.locator(".cache-press").waitFor();
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    await page.getByRole("button", { name: /Share one fetch/ }).click();
    await page.getByRole("button", { name: "Send & see the result" }).click();
    await expect(page.locator('[data-state="done"]')).toHaveCount(24);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const result = await new AxeBuilder({ page })
      .include("#cache-rescue")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.failureSummary),
      })),
    ).toEqual([]);
  });
}
