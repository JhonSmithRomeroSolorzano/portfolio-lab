import { expect, test } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

for (const width of [390, 1440])
  for (const theme of ["light", "dark"] as const)
    for (const outcome of ["success", "failure"] as const) {
      test(`late ${outcome} after leaving a loading lab preserves focus and scroll at ${width}px in ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        let release!: () => void;
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        let requests = 0;
        await page.route("**/MotionStudio-*.js", async (route) => {
          requests++;
          await held;
          if (outcome === "failure")
            await route.fulfill({
              status: 503,
              contentType: "text/javascript",
              body: "temporarily unavailable",
            });
          else await route.continue();
        });
        try {
          await page.goto("/?entry=delayed#motion-studio", {
            waitUntil: "domcontentloaded",
          });
          await expect(
            page
              .getByRole("status")
              .filter({ hasText: "Loading Motion studio" }),
          ).toBeAttached();
          await openMainNavigation(page);
          await page
            .getByRole("navigation", { name: "Main navigation", exact: true })
            .getByRole("link", { name: "Overview", exact: true })
            .press("Enter");
          await expect(page.locator("#workbench")).toBeFocused();
          await expect(page.locator("#workbench")).toBeInViewport();
          const scroll = await page.evaluate(() => scrollY);
          release();
          if (outcome === "failure")
            await expect(
              page.getByRole("button", { name: "Reload page", exact: true }),
            ).toBeAttached();
          else
            await expect(
              page.getByRole("button", { name: "Show end state", exact: true }),
            ).toBeAttached();
          await expect(page.locator("#workbench")).toBeFocused();
          await expect(page.locator("#workbench")).toBeInViewport();
          expect(await page.evaluate(() => scrollY)).toBe(scroll);
          await expect(page).toHaveURL(/\?entry=delayed#workbench$/);
          expect(requests).toBe(1);
          expect(errors).toEqual([]);
        } finally {
          release();
          await page.unrouteAll({ behavior: "wait" });
        }
      });
    }
