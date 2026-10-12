import { test, expect } from "@playwright/test";

test("a tab checks the latest save before acting when browser notifications are delayed", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    // Model a suspended tab whose storage/focus notifications have not arrived.
    for (const name of ["storage", "focus"]) {
      window.addEventListener(
        name,
        (event) => event.stopImmediatePropagation(),
        true,
      );
    }
  });
  await page.goto("/#connection-game");
  await expect(page.locator(".route-score")).toContainText("0 turns");
  const other = await context.newPage();
  await other.goto("/#connection-game");
  await other.getByRole("button", { name: /Row 1, column 1:/ }).press("Space");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await expect(page.locator(".route-score")).toContainText("0 turns");

  const tile = page.getByRole("button", { name: /Row 1, column 2:/ });
  const initial = await tile.getAttribute("aria-label");
  await tile.press("Space");
  await expect(page.locator(".route-save")).toContainText(
    "try your action again",
  );
  await expect(page.locator(".route-score")).toContainText("1 turn");
  await expect(tile).toHaveAttribute("aria-label", initial!);
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("2 turns");
  await expect(other.locator(".route-score")).toContainText("2 turns");
  await other.reload();
  await expect(other.locator(".route-score")).toContainText("2 turns");
  await other.close();
});

test("open puzzle tabs share moves without changing the other tab's selected puzzle", async ({
  page,
  context,
}) => {
  await page.goto("/#connection-game");
  const other = await context.newPage();
  await other.goto("/#connection-game");
  const firstTile = page.getByRole("button", { name: /Row 1, column 1:/ });
  await firstTile.press("Space");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await expect(
    other.getByRole("button", { name: /Row 1, column 1:/ }),
  ).toHaveAttribute(
    "aria-label",
    (await firstTile.getAttribute("aria-label"))!,
  );

  await other.getByLabel("Choose a puzzle").selectOption("1");
  await other.getByRole("button", { name: /Row 2, column 1:/ }).press("Space");
  await expect(page.getByLabel("Choose a puzzle")).toHaveValue("0");
  await expect(page.locator(".route-save")).toContainText("another tab");
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Undo turn", exact: true })
    .press("Enter");
  await expect(other.getByLabel("Choose a puzzle")).toHaveValue("1");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await other.reload();
  await other.getByLabel("Choose a puzzle").selectOption("1");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await other.close();
});

test("an external board update clears only obsolete undo and hints without moving focus", async ({
  page,
  context,
}) => {
  await page.goto("/#connection-game");
  const other = await context.newPage();
  await other.goto("/#connection-game");
  await page.getByRole("button", { name: /Row 1, column 1:/ }).press("Space");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await other.getByRole("button", { name: /Row 1, column 2:/ }).press("Space");
  await expect(page.locator(".route-score")).toContainText("2 turns");
  await other
    .getByRole("button", { name: "Give me a hint", exact: true })
    .press("Enter");
  const focus = other.getByRole("button", { name: /Row 2, column 1:/ });
  await focus.focus();
  await page.getByRole("button", { name: /Row 1, column 3:/ }).press("Space");
  await expect(other.locator(".route-score")).toContainText("3 turns");
  await expect(
    other.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
  await expect(other.locator(".route-hint [role=status]")).toBeEmpty();
  await expect(focus).toBeFocused();
  await other.close();
});

test("cleared and corrupt external saves do not restore stale history or discard playable progress", async ({
  page,
  context,
}) => {
  await page.goto("/#connection-game");
  const other = await context.newPage();
  await other.goto("/");
  const tile = page.getByRole("button", { name: /Row 1, column 1:/ });
  await tile.press("Space");
  const changed = await tile.getAttribute("aria-label");
  await other.evaluate(() => {
    sessionStorage.setItem("jsr-connection-progress-v1", "{}");
    localStorage.setItem("unrelated-preference", "keep");
  });
  await expect(tile).toHaveAttribute("aria-label", changed!);
  await other.evaluate(() =>
    localStorage.setItem("jsr-connection-progress-v1", "{bad"),
  );
  await expect(page.locator(".route-save")).toContainText("could not be read");
  await expect(tile).toHaveAttribute("aria-label", changed!);
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("2 turns");
  await other.evaluate(() => localStorage.clear());
  await expect(page.locator(".route-score")).toContainText("0 turns");
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".route-save")).toContainText(
    "cleared in another tab",
  );
  await expect
    .poll(() =>
      other.evaluate(() => localStorage.getItem("jsr-connection-progress-v1")),
    )
    .toBeNull();
  await other.close();
});
