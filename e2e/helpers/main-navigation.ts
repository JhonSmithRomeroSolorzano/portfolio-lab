import { expect, type Page } from "@playwright/test";

export async function openMainNavigation(page: Page) {
  await expect(page.locator(".identity-rail")).toHaveAttribute(
    "data-menu-ready",
    "true",
  );
  const toggle = page.getByRole("button", { name: "Menu", exact: true });
  if (
    (await toggle.isVisible()) &&
    (await toggle.getAttribute("aria-expanded")) === "false"
  )
    await toggle.press("Enter");
}
