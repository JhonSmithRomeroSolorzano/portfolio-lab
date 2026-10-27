import { expect, test } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    test(`section navigation avoids a page-sized outline at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.goto("/?review=section-focus");
      const nav = page.getByRole("navigation", { name: "Main navigation" });

      for (const [label, id] of [
        ["Résumé", "resume"],
        ["Contact", "contact"],
      ]) {
        await openMainNavigation(page);
        const link = nav.getByRole("link", { name: label, exact: true });
        await link.press("Enter");
        const section = page.locator(`#${id}`);
        await expect(section).toBeFocused();
        await expect(page).toHaveURL(new RegExp(`review=section-focus#${id}$`));
        await expect(section).toHaveCSS("outline-style", "none");

        // Moving into the section still exposes the interactive focus indicator.
        await page.keyboard.press("Tab");
        const focused = page.locator(":focus");
        await expect(focused).toHaveCSS("outline-style", "solid");
        await expect(focused).toHaveCSS("outline-width", "3px");
      }
    });
  }
}
