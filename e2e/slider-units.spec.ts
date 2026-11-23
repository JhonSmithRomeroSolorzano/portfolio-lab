import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`lab sliders expose units during keyboard editing in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({
      width: theme === "light" ? 1280 : 390,
      height: 900,
    });
    await page.goto("/#motion-studio");
    const duration = page.getByRole("slider", { name: /Duration/ });
    await expect(duration).toHaveAccessibleName("Duration");
    await expect(duration).toHaveAttribute("aria-valuetext", "1.1 seconds");
    await duration.press("Home");
    await expect(duration).toHaveValue("600");
    await expect(duration).toHaveAttribute("aria-valuetext", "0.6 seconds");
    await duration.press("ArrowRight");
    await expect(duration).toBeFocused();
    await expect(duration).toHaveAccessibleName("Duration");
    await expect(duration).toHaveAttribute("aria-valuetext", "0.7 seconds");
    await duration.press("End");
    await expect(duration).toHaveValue("1800");
    await expect(duration).toHaveAttribute("aria-valuetext", "1.8 seconds");
    await page.getByText("Take this motion with you", { exact: true }).click();
    await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
      /portfolio-travel 1800ms/,
    );

    await page.goto("/#jet-engine");
    const speed = page.getByRole("slider", {
      name: "Engine speed",
      exact: true,
    });
    await expect(speed).toHaveAttribute("aria-valuetext", "35%");
    await speed.press("Home");
    await expect(speed).toHaveValue("0");
    await expect(speed).toHaveAttribute("aria-valuetext", "0%");
    await speed.press("ArrowRight");
    await expect(speed).toBeFocused();
    await expect(speed).toHaveAttribute("aria-valuetext", "1%");
    await speed.press("End");
    await expect(speed).toHaveAttribute("aria-valuetext", "100%");
    await page.getByRole("button", { name: /^Cruise/ }).click();
    await expect(speed).toHaveAttribute("aria-valuetext", "60%");
    await page
      .locator(".jet-engine")
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await expect(speed).toHaveValue("35");
    await expect(speed).toHaveAttribute("aria-valuetext", "35%");
    await expect(page.locator(".jet-engine")).toHaveAttribute(
      "data-playing",
      "false",
    );
  });
}
