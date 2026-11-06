import { expect, test } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

for (const width of [390, 1280])
  for (const theme of ["light", "dark"] as const)
    for (const reducedMotion of ["no-preference", "reduce"] as const)
      test(`pointer navigation hands off focus before native scrolling at ${width}px in ${theme}, ${reducedMotion}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion });
        await page.goto("/?navigation=pointer#about");
        await expect(page.locator('nav a[href="#workbench"]')).toHaveAttribute(
          "aria-current",
          "location",
        );
        await expect(page.locator("#about")).toBeInViewport();
        await openMainNavigation(page);
        await page.evaluate(() => {
          // Bubble after React's delegated click handler, but before the
          // browser's anchor default action changes the hash and scrolls.
          window.addEventListener("click", (event) => {
            const link = (event.target as Element).closest<HTMLAnchorElement>(
              '#main-navigation a[href="#lab"]',
            );
            if (!link) return;
            document.documentElement.dataset.beforeNativeNavigation =
              JSON.stringify({
                focus: document.activeElement?.id,
                hash: location.hash,
                prevented: event.defaultPrevented,
                scrollBehavior: getComputedStyle(document.documentElement)
                  .scrollBehavior,
              });
          });
        });
        await page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Labs & play" })
          .click();
        expect(
          await page.evaluate(() =>
            JSON.parse(
              document.documentElement.dataset.beforeNativeNavigation!,
            ),
          ),
        ).toEqual({
          focus: "lab",
          hash: "#about",
          prevented: false,
          scrollBehavior: reducedMotion === "reduce" ? "auto" : "smooth",
        });
        await expect(page).toHaveURL("/?navigation=pointer#lab");
        await expect(page.locator("#lab")).toBeFocused();
        await expect(page.locator("#collection")).toBeInViewport();
        await expect(page.locator("#lab")).toHaveAttribute(
          "data-pointer-navigation",
          "true",
        );
        await page.keyboard.press("Tab");
        await expect(page.locator("#lab")).not.toHaveAttribute(
          "data-pointer-navigation",
        );
        await expect(page.locator(":focus")).toHaveCSS(
          "outline-style",
          "solid",
        );
        await page.goBack();
        await expect(page).toHaveURL("/?navigation=pointer#about");
        await expect(page.locator("#about")).toBeInViewport();
        await openMainNavigation(page);
        await page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Labs & play" })
          .press("Enter");
        await expect(page.locator("#lab")).toBeFocused();
        await expect(page.locator("#lab")).not.toHaveAttribute(
          "data-pointer-navigation",
        );
        await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
        await expect(page.locator("#collection")).toBeInViewport();
      });
