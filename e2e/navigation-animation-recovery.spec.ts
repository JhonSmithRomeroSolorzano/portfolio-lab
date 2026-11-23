import { expect, test } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

for (const width of [390, 1280])
  for (const failure of ["arrival", "entrance"] as const)
    test(`navigation survives rejected ${failure} animation at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: width === 390 ? "light" : "dark",
        reducedMotion: "no-preference",
      });
      await page.addInitScript((failure) => {
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          if (
            this.matches(
              failure === "arrival" ? ".section-signal" : "[data-reveal]",
            )
          ) {
            document.documentElement.dataset.rejectedDecoration = "true";
            throw new DOMException(
              "Animation unavailable",
              "NotSupportedError",
            );
          }
          return animate.apply(this, args);
        };
      }, failure);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/?navigation=recovery#workbench");
      // The mobile menu closes after activation; inspect its persistent links
      // even while the navigation region is intentionally hidden.
      const navigation = page.locator("#main-navigation");
      for (const [label, id] of [
        ["Experience", "resume"],
        ["Contact", "contact"],
      ]) {
        await openMainNavigation(page);
        await navigation
          .getByRole("link", { name: label, exact: true })
          .press("Enter");
        await expect(page).toHaveURL(`/?navigation=recovery#${id}`);
        await expect(page.locator(`#${id}`)).toBeFocused();
        await expect(page.locator(`#${id}`)).toBeInViewport();
        await expect(navigation.locator(`a[href="#${id}"]`)).toHaveAttribute(
          "aria-current",
          "location",
        );
      }
      await expect(page.locator("html")).toHaveAttribute(
        "data-rejected-decoration",
        "true",
      );
      // Ordinary scrolling still updates feedback after a failed arrival.
      await page
        .locator("#workbench")
        .evaluate((node) =>
          node.scrollIntoView({ behavior: "instant", block: "start" }),
        );
      await expect(navigation.locator('a[href="#workbench"]')).toHaveAttribute(
        "aria-current",
        "location",
      );
      expect(errors).toEqual([]);
      await expect(
        page.getByRole("link", { name: "Download PDF", exact: true }),
      ).toHaveAttribute("href", /\.pdf$/);
    });
