import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`garden exposes tree relationships through selection and play in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({
      width: theme === "light" ? 1280 : 390,
      height: 900,
    });
    await page.goto("/#algorithm-garden");
    const node = (id: string) =>
      page.getByRole("button", { name: new RegExp(`^Node ${id}(,|$)`) });
    await expect(node("A")).toHaveAccessibleDescription(
      "Root node. Children from left to right: B, C.",
    );
    await expect(node("B")).toHaveAccessibleDescription(
      "Parent: A. Children from left to right: D, E.",
    );
    await expect(node("D")).toHaveAccessibleDescription(
      "Parent: B. No children.",
    );

    await page
      .getByRole("button", { name: "Deep roots", exact: true })
      .press("Enter");
    await expect(node("C")).toHaveAccessibleDescription(
      "Parent: A. No children.",
    );
    await expect(node("D")).toHaveAccessibleDescription(
      "Parent: B. Children from left to right: F, G.",
    );
    await expect(node("F")).toHaveAccessibleDescription(
      "Parent: D. No children.",
    );
    await page
      .getByRole("button", { name: /Down the branches/ })
      .press("Enter");
    for (const id of ["A", "B", "D", "F", "G", "E", "C"]) {
      await node(id).press("Space");
      await expect(node(id)).toBeFocused();
      await expect(node(id)).toHaveAttribute("aria-disabled", "true");
    }
    await expect(page.locator(".garden-feedback")).toContainText(
      "Garden complete!",
    );
    await expect(node("D")).toHaveAccessibleDescription(
      "Parent: B. Children from left to right: F, G.",
    );

    await page
      .getByRole("button", { name: "Open canopy", exact: true })
      .press("Enter");
    await expect(node("G")).toHaveCount(0);
    await expect(node("B")).toHaveAccessibleDescription(
      "Parent: A. Children from left to right: D.",
    );
    await expect(node("C")).toHaveAccessibleDescription(
      "Parent: A. Children from left to right: E, F.",
    );
    await expect(node("F")).toHaveAccessibleDescription(
      "Parent: C. No children.",
    );
    await page.getByRole("button", { name: /Across the rows/ }).press("Enter");
    for (const id of ["A", "B", "C", "D", "E", "F"])
      await node(id).press("Enter");
    await expect(page.locator(".garden-trail")).toHaveText("ABCDEF");
    await page.getByRole("button", { name: "Reset garden" }).press("Enter");
    await expect(node("F")).toHaveAccessibleName("Node F");
    await expect(node("F")).toHaveAccessibleDescription(
      "Parent: C. No children.",
    );
    await expect(node("F")).toHaveAttribute("aria-disabled", "false");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

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

test("optional frontier shows why breadth and depth choose different next nodes", async ({
  page,
}) => {
  await page.goto("/#algorithm-garden");
  await page
    .getByText("See how this traversal works", { exact: true })
    .press("Enter");
  for (const id of ["A", "B"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Space");
  await expect(
    page.getByRole("list", { name: "Queue, front first" }),
  ).toHaveText("CDE");
  await expect(page.locator(".garden-step")).toContainText("C is next");
  await page.getByRole("button", { name: /Down the branches/ }).click();
  for (const id of ["A", "B"])
    await page
      .getByRole("button", { name: `Node ${id}`, exact: true })
      .press("Space");
  await expect(page.getByRole("list", { name: "Stack, top first" })).toHaveText(
    "DEC",
  );
  await expect(page.locator(".garden-step")).toContainText("D is next");
});
