import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`stack tour follows pointer-to-keyboard changes without a new focus event at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const drawing = page.locator(".stack-drawing");
    const backend = page.locator(".stack-node-backend");
    await backend.click();
    // WebKit does not necessarily focus native buttons on mouse clicks.
    // Keep the pointer modality but focus the same node before using the keyboard.
    await backend.focus();
    await expect(drawing).toHaveAttribute("data-playing", "true");
    await backend.press("Enter");
    await expect(backend).toBeFocused();
    await expect(drawing).toHaveAttribute("data-playing", "false");
    await expect(backend).toHaveAttribute("aria-pressed", "true");
    await backend.click();
    await expect(drawing).toHaveAttribute("data-playing", "true");
    await backend.press("Space");
    await expect(drawing).toHaveAttribute("data-playing", "false");
    await page.locator(".stack-node-data").click();
    await expect(drawing).toHaveAttribute("data-playing", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await backend.click();
    await expect(drawing).toHaveAttribute("data-playing", "false");
  });
}
