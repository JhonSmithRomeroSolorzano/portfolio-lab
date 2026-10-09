import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const theme of ["light", "dark"] as const) {
  test(`recruiter journey and interactive pieces pass automated accessibility checks in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    const initial = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice", "wcag21a"])
      .analyze();
    expect(
      initial.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    for (const hash of [
      "workbench",
      "resume",
      "contact",
      "signal-lab",
      "connection-game",
      "motion-studio",
    ]) {
      if (hash !== "workbench")
        await page.locator(`a[href="#${hash}"]`).first().press("Enter");
      const ready =
        hash === "signal-lab"
          ? page.getByRole("button", { name: "Expand workspace" })
          : hash === "connection-game"
            ? page.getByRole("button", { name: "Give me a hint" })
            : hash === "motion-studio"
              ? page.locator(".motion-play")
              : page.locator(`#${hash}`);
      await expect(ready).toBeVisible();
      const result = await new AxeBuilder({ page })
        .include(`#${hash}`)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice", "wcag21a"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    }
  });
}

test("200 percent text remains readable and usable on a narrow screen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await expect(page.getByLabel("Core technologies")).toBeVisible();
  for (const area of ["frontend", "backend", "data", "infrastructure"]) {
    await page
      .getByRole("button", { name: new RegExp(`^${area} `, "i") })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  const cards = await page.locator(".stack-node").evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
    })),
  );
  expect(
    cards.every(
      (card) =>
        card.contentWidth <= card.width + 1 &&
        card.contentHeight <= card.height + 1,
    ),
  ).toBeTruthy();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  expect(
    await page
      .locator(".experience-project li")
      .first()
      .evaluate((node) => getComputedStyle(node).fontSize),
  ).toBe("32px");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
