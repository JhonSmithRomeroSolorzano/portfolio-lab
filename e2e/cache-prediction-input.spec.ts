import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`unfinished numeric predictions require correction at ${width}px ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: width === 390 ? "reduce" : "no-preference",
      });
      await page.goto("/#cache-rescue");
      const panel = page.locator(".cache-prediction");
      await panel.locator("summary").click();
      const input = page.getByRole("spinbutton", {
        name: "How many database reads?",
      });
      const launch = page.locator(".cache-launch");
      for (const unfinished of ["-", "1e"]) {
        await input.fill("");
        await input.pressSequentially(unfinished);
        // Native number inputs expose an empty value for unfinished edits.
        // Use actual typing, not a mocked validity flag or value assignment.
        await expect(input).toHaveValue("");
        expect(
          await input.evaluate(
            (node: HTMLInputElement) => node.validity.badInput,
          ),
        ).toBe(true);
        await launch.focus();
        await launch.press("Enter");
        await expect(input).toHaveAttribute("aria-invalid", "true");
        await expect(input).toBeEnabled();
        await expect(input).toBeFocused();
        await expect(input).toHaveAccessibleDescription(
          /Use a whole number from 1 to 24/,
        );
        await expect(page.locator(".cache-feedback")).toContainText(
          "Choose a strategy",
        );
        await input.press("ControlOrMeta+A");
        await input.press("Backspace");
        // The exposed value stays empty while the native edit becomes valid.
        await expect(input).toHaveAttribute("aria-invalid", "false");
        expect(
          await input.evaluate(
            (node: HTMLInputElement) => node.validity.badInput,
          ),
        ).toBe(false);
      }
      for (const reset of [
        page.locator(".cache-reset"),
        page.getByRole("button", { name: "Challenge 02: A rolling wave" }),
        page.getByRole("button", { name: /Share one fetch/ }),
      ]) {
        await input.pressSequentially("1e");
        expect(
          await input.evaluate(
            (node: HTMLInputElement) => node.validity.badInput,
          ),
        ).toBe(true);
        await reset.click();
        await expect(input).toHaveValue("");
        expect(
          await input.evaluate(
            (node: HTMLInputElement) => node.validity.badInput,
          ),
        ).toBe(false);
      }
      await page
        .getByRole("button", { name: "Challenge 01: The morning rush" })
        .click();
      await page.getByRole("button", { name: /Everyone fetches/ }).click();
      // A genuinely empty optional prediction still launches successfully.
      await input.fill("1");
      await input.fill("");
      expect(
        await input.evaluate(
          (node: HTMLInputElement) => node.validity.badInput,
        ),
      ).toBe(false);
      await launch.focus();
      await launch.press("Enter");
      await expect(input).toHaveAttribute("aria-invalid", "false");
      await expect(input).toBeDisabled();
      await expect(page.locator(".cache-feedback")).toContainText(
        "24 replies delivered",
      );
      await expect(launch).toBeFocused();
    });
  }
}
