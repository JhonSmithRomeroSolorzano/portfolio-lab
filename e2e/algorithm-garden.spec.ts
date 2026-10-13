import { test, expect } from "@playwright/test";

test("reselecting the current traversal preserves the garden and its hint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#algorithm-garden");
  await page
    .getByRole("button", { name: "Node A", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: "Hint the next node" }).press("Enter");
  await page.getByRole("button", { name: /Across the rows/ }).press("Enter");
  await expect(page.locator(".garden-caption")).toContainText("1 / 7 LIT");
  await expect(page.locator(".garden-feedback")).toHaveText("Try B next.");
  await expect(
    page.getByRole("button", { name: "Node B", exact: true }),
  ).toHaveClass(/is-hinted/);
  await page.getByRole("button", { name: /Down the branches/ }).press("Enter");
  await expect(page.locator(".garden-caption")).toContainText("0 / 7 LIT");
  await page
    .getByRole("button", { name: "Node A", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: /Down the branches/ }).press("Enter");
  await expect(page.locator(".garden-caption")).toContainText("1 / 7 LIT");
  await page.getByRole("button", { name: "Reset garden" }).press("Enter");
  await expect(page.locator(".garden-caption")).toContainText("0 / 7 LIT");
});

test("garden teaches both traversals with hints, recoverable mistakes and keyboard play", async ({
  page,
}) => {
  await page.goto("/#algorithm-garden");
  await page
    .getByRole("button", { name: "Node G", exact: true })
    .press("Enter");
  await expect(page.locator(".garden-feedback")).toContainText("G can wait");
  await expect(page.locator(".garden-caption")).toContainText("0 / 7 LIT");
  await page.getByRole("button", { name: "Hint the next node" }).press("Enter");
  await expect(
    page.getByRole("button", { name: "Node A", exact: true }),
  ).toHaveClass(/is-hinted/);
  for (const id of ["A", "B", "C", "D", "E", "F", "G"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Space");
  await expect(page.locator(".garden-feedback")).toContainText(
    "Garden complete!",
  );
  await expect(
    page.getByRole("button", { name: "Hint the next node" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Down the branches/ }).press("Enter");
  await expect(page.locator(".garden-trail")).toHaveText("·······");
  for (const id of ["A", "B", "D", "E", "C", "F", "G"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Enter");
  await expect(page.locator(".garden-feedback")).toContainText(
    "Depth-first follows a branch",
  );
  await expect(page.locator(".garden-trail")).toHaveText("ABDECFG");
  await page.getByRole("button", { name: "Reset garden" }).press("Enter");
  await expect(page.locator(".garden-caption")).toContainText("0 / 7 LIT");
});

test("tree choices offer distinct solvable boards without resetting the selected tree", async ({
  page,
}) => {
  await page.goto("/#algorithm-garden");
  await page.getByRole("button", { name: "Deep roots", exact: true }).click();
  await page.getByRole("button", { name: /Down the branches/ }).click();
  await page
    .getByRole("button", { name: "Node A", exact: true })
    .press("Space");
  await page.getByRole("button", { name: "Deep roots", exact: true }).click();
  await expect(page.locator(".garden-caption")).toContainText("1 / 7");
  for (const id of ["B", "D", "F", "G", "E", "C"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Space");
  await expect(page.locator(".garden-feedback")).toContainText(
    "Garden complete",
  );
  await page.getByRole("button", { name: "Open canopy", exact: true }).click();
  await expect(page.locator(".garden-caption")).toContainText("0 / 6");
  for (const id of ["A", "B", "D", "C", "E", "F"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Space");
  await expect(page.locator(".garden-feedback")).toContainText(
    "Garden complete",
  );
});
