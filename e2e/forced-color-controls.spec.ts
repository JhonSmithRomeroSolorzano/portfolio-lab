import { expect, test, type Page } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

async function systemSelection(page: Page) {
  return page.evaluate(() => {
    const sample = document.createElement("button");
    sample.style.cssText =
      "position:fixed;visibility:hidden;background:Highlight;color:HighlightText";
    document.body.append(sample);
    const style = getComputedStyle(sample);
    const colors = { fill: style.backgroundColor, ink: style.color };
    sample.remove();
    return colors;
  });
}

const experiences = [
  { id: "cache-rescue", groups: [".cache-rounds", ".cache-strategies"] },
  { id: "motion-studio", groups: [".motion-options"] },
  { id: "algorithm-garden", groups: [".garden-shapes", ".garden-modes"] },
  { id: "signal-sculpture", groups: [".sculpture-forms"] },
  { id: "gravity-loom", groups: ['[aria-label="Flow pattern"]'] },
  { id: "jet-engine", groups: [".engine-presets", ".engine-thrust-control"] },
] as const;

for (const theme of ["light", "dark"] as const) {
  for (const experience of experiences) {
    test(`${experience.id} keeps selection visible in forced colors, ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({
        width: theme === "light" ? 1440 : 375,
        height: 1000,
      });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "reduce",
        forcedColors: "active",
      });
      await page.goto(`/#${experience.id}`);
      const section = page.locator(`#${experience.id}`);
      const palette = await systemSelection(page);
      for (const selector of experience.groups) {
        const group = section.locator(selector);
        await expect(
          group.locator('button[aria-pressed="false"]').first(),
        ).toBeVisible();
        const buttons = group.locator("button");
        const index = await buttons.evaluateAll((nodes) =>
          nodes.findIndex(
            (node) => node.getAttribute("aria-pressed") === "false",
          ),
        );
        expect(index).toBeGreaterThanOrEqual(0);
        // Keep the same element after activation changes its pressed state.
        const choice = buttons.nth(index);
        await expect(choice).toBeEnabled();
        const unselectedFill = await choice.evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        );
        await choice.press("Enter");
        await expect(choice).toHaveAttribute("aria-pressed", "true");
        await expect(choice).toBeFocused();
        await expect(choice).toBeInViewport();
        await expect(choice).toHaveCSS("background-color", palette.fill);
        await expect(choice).toHaveCSS("color", palette.ink);
        expect(palette.fill).not.toBe(unselectedFill);
        await expect(choice).toHaveCSS("outline-style", "solid");
        await expect(choice).toHaveCSS("outline-width", "3px");
        for (const child of await choice.locator("strong, small, span").all())
          await expect(child).toHaveCSS("color", palette.ink);
      }
      await section.screenshot({
        path: `artifacts/forced-controls-${experience.id}-${theme}-${testInfo.project.name}.png`,
      });
    });
  }
  test(`current navigation stays distinct in forced colors, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: theme === "light" ? 1440 : 375,
      height: 1000,
    });
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "reduce",
      forcedColors: "active",
    });
    await page.goto("/?review=forced-colors#resume");
    await openMainNavigation(page);
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    const palette = await systemSelection(page);
    const experience = navigation.getByRole("link", {
      name: "Experience",
      exact: true,
    });
    await expect(experience).toHaveAttribute("aria-current", "location");
    await expect(experience).toHaveCSS("background-color", palette.fill);
    await expect(experience).toHaveCSS("color", palette.ink);
    const contact = navigation.getByRole("link", {
      name: "Contact",
      exact: true,
    });
    await contact.press("Enter");
    await expect(page.locator("#contact")).toBeFocused();
    await expect(page.locator("#contact")).toBeInViewport();
    await expect(page).toHaveURL(/\?review=forced-colors#contact$/);
    await openMainNavigation(page);
    await expect(contact).toHaveAttribute("aria-current", "location");
    await expect(contact).toHaveCSS("background-color", palette.fill);
    await expect(contact).toHaveCSS("color", palette.ink);
    await expect(experience).not.toHaveAttribute("aria-current", "location");
    await expect(experience).not.toHaveCSS("background-color", palette.fill);
    await navigation.screenshot({
      path: `artifacts/forced-navigation-${theme}-${testInfo.project.name}.png`,
    });
  });
}
