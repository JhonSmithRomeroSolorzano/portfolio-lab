import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

for (const theme of ["light", "dark"])
  for (const width of [320, 1440]) {
    test(`expanded experiences remain readable and accessible at ${width}px in ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.goto("/#algorithm-garden");
      await page
        .getByRole("button", { name: "Deep roots", exact: true })
        .click();
      await page
        .getByText("See how this traversal works", { exact: true })
        .click();
      for (const id of ["A", "B"])
        await page
          .getByRole("button", { name: `Node ${id}`, exact: true })
          .press("Space");
      await page
        .locator('.collection-index a[href="#connection-game"]')
        .click();
      await page.getByText("Your puzzle records", { exact: true }).click();
      await page.locator('.collection-index a[href="#cache-rescue"]').click();
      await page.getByText("Predict before you play", { exact: true }).click();
      await page.getByLabel("How many database reads?").fill("1");
      await page
        .getByRole("button", { name: "Send & see the result", exact: true })
        .click();
      await page.locator('.collection-index a[href="#motion-studio"]').click();
      await page
        .getByText("Take this motion with you", { exact: true })
        .click();
      await mkdir("artifacts/review-oct13", { recursive: true });
      for (const [id, title] of [
        ["cache-rescue", "Cache Rescue"],
        ["connection-game", "Connection puzzle"],
        ["motion-studio", "Motion studio"],
        ["algorithm-garden", "Algorithm Garden"],
      ]) {
        const section = page.locator(`#${id}`);
        await section
          .getByText(`How I built ${title}`, { exact: true })
          .press("Enter");
        await expect(
          section.getByRole("link", {
            name: `Explore ${title} source ↗`,
            exact: true,
          }),
        ).toHaveAttribute(
          "href",
          /^https:\/\/github.com\/JhonSmithRomeroSolorzano\/portfolio-lab\/tree\/main\/src\/features\/playground\//,
        );
        expect(
          (await new AxeBuilder({ page }).include(`#${id}`).analyze())
            .violations,
        ).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
        await section.screenshot({
          path: `artifacts/review-oct13/${info.project.name}-${theme}-${width}-${id}.png`,
        });
      }
    });
  }
