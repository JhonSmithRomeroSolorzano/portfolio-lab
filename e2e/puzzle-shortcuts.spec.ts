import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`puzzle leaves modified navigation keys to the browser at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#connection-game");
    const tiles = page.locator(".route-tile");
    await expect(tiles).toHaveCount(16);
    const tile = tiles.nth(5);
    await tile.focus();
    const label = await tile.getAttribute("aria-label");
    for (const modifier of ["altKey", "ctrlKey", "metaKey"] as const) {
      for (const key of [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ]) {
        const prevented = await tile.evaluate(
          (node, input) => {
            const event = new KeyboardEvent("keydown", {
              key: input.key,
              [input.modifier]: true,
              bubbles: true,
              cancelable: true,
            });
            node.dispatchEvent(event);
            return event.defaultPrevented;
          },
          { key, modifier },
        );
        expect(prevented, `${modifier} ${key}`).toBe(false);
        await expect(tile).toBeFocused();
        await expect(tile).toHaveAttribute("aria-label", label!);
      }
    }
    await tile.press("ArrowRight");
    await expect(tiles.nth(6)).toBeFocused();
    await tiles.nth(6).press("Home");
    await expect(tiles.nth(4)).toBeFocused();
    await tiles.nth(4).press("End");
    await expect(tiles.nth(7)).toBeFocused();
    const before = await tiles.nth(7).getAttribute("aria-label");
    await tiles.nth(7).press("Space");
    await expect(tiles.nth(7)).not.toHaveAttribute("aria-label", before!);
    await expect(page.locator('.route-tile[tabindex="0"]')).toHaveCount(1);
  });
}
