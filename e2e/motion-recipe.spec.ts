import { test, expect } from "@playwright/test";

test("motion recipe follows the selected curve and copies a reduced-motion-safe example", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          Object.assign(window, { copiedCss: text });
        },
      },
    }),
  );
  await page.goto("/#motion-studio");
  await page.getByText("Take this motion with you", { exact: true }).click();
  await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
    /1100ms cubic-bezier\(\.16,1,\.3,1\)/,
  );
  await page.getByRole("button", { name: "Copy CSS", exact: true }).click();
  await expect(page.locator(".motion-recipe [role=status]")).toContainText(
    "CSS copied",
  );
  const css = await page.evaluate(() => Reflect.get(window, "copiedCss"));
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain("animation: none");
  await page.getByRole("button", { name: "Steady", exact: true }).click();
  await page.getByText("Take this motion with you", { exact: true }).click();
  await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
    /1100ms linear/,
  );
  await expect(page.locator(".motion-recipe [role=status]")).toBeEmpty();
});
test("blocked clipboard gives a selectable CSS fallback", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await page.goto("/#motion-studio");
  await page
    .getByText("Take this motion with you", { exact: true })
    .press("Enter");
  await page
    .getByRole("button", { name: "Copy CSS", exact: true })
    .press("Enter");
  await expect(page.getByLabel("Reusable animation CSS")).toBeFocused();
  await expect(page.locator(".motion-recipe [role=status]")).toContainText(
    "copy it manually",
  );
});
