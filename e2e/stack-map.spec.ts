import { test, expect } from "@playwright/test";

for (const width of [1920, 1440, 900, 390]) {
  test(`stack map reserves the same intrinsic height for all four layers at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const map = page.locator(".stack-map");
    const initial = await map.evaluate(
      (el) => el.getBoundingClientRect().height,
    );
    for (const name of ["Backend", "Data", "Infrastructure", "Frontend"]) {
      await page.getByRole("button", { name: new RegExp(`^${name} `) }).click();
      expect(
        await map.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeCloseTo(initial, 0);
      const region = page.getByRole("region", {
        name: "Selected stack experience",
      });
      await expect(region.getByRole("heading")).toHaveCount(1);
      await expect(region.getByRole("link")).toHaveCount(1);
      const selected = page.locator('.stack-detail[aria-hidden="false"]');
      expect(
        await selected.evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBeTruthy();
    }
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    const enlarged = await map.evaluate(
      (el) => el.getBoundingClientRect().height,
    );
    for (const name of ["Backend", "Data", "Infrastructure"]) {
      await page.getByRole("button", { name: new RegExp(`^${name} `) }).click();
      expect(
        await map.evaluate((el) => el.getBoundingClientRect().height),
      ).toBeCloseTo(enlarged, 0);
    }
  });
}
