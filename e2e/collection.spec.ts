import { test, expect } from "@playwright/test";
import {
  solvedBoard,
  startingBoard,
  rotateTile,
} from "../src/play/route-puzzle";

test("connection puzzle works with keyboard input, undo, reset, and a complete solution", async ({
  page,
}) => {
  await page.goto("/#connection-game");
  const tiles = page
    .getByRole("group", { name: "Connection puzzle", exact: true })
    .getByRole("button");
  await tiles.nth(0).focus();
  await tiles.nth(0).press("ArrowRight");
  await expect(tiles.nth(1)).toBeFocused();
  const initial = await tiles.nth(1).getAttribute("aria-label");
  await tiles.nth(1).press("Space");
  await expect(tiles.nth(1)).not.toHaveAttribute("aria-label", initial!);
  await page.getByRole("button", { name: "Undo turn", exact: true }).click();
  await expect(tiles.nth(1)).toHaveAttribute("aria-label", initial!);
  const start = startingBoard(0),
    solved = solvedBoard(0);
  for (let i = 0; i < start.length; i++) {
    for (let turns = 0; start[i] !== solved[i] && turns < 4; turns++) {
      await tiles.nth(i).click();
      start[i] = rotateTile(start[i]);
    }
  }
  await expect(page.locator(".route-feedback")).toContainText(
    "Connection made",
  );
  await page.getByRole("button", { name: "Start again", exact: true }).click();
  await expect(page.locator(".route-feedback")).not.toContainText(
    "Connection made",
  );
  await expect(page.locator(".route-score")).toContainText("0 turns");
  await page.getByLabel("Choose a puzzle").selectOption("2");
  await expect(page.locator(".route-score")).toContainText("Switchback");
});

test("motion studio is explicit, replayable, and honors live reduced-motion changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#motion-studio");
  const runner = page.locator(".motion-runner");
  expect(await runner.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.getByRole("button", { name: "Play motion", exact: false }).click();
  await expect(page.locator(".motion-feedback")).toHaveText("In motion…");
  await expect(runner).toHaveClass(/has-arrived/);
  await page
    .getByRole("button", { name: "A little bounce", exact: true })
    .click();
  await expect(runner).not.toHaveClass(/has-arrived/);
  await page.getByRole("button", { name: "Play motion", exact: false }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Show end state", exact: true }),
  ).toBeVisible();
  expect(await runner.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page
    .getByRole("button", { name: "Show end state", exact: true })
    .click();
  await expect(runner).toHaveClass(/has-arrived/);
});

test("collection keeps navigation and expanded-workspace isolation on a narrow screen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?traffic=600#lab");
  await page
    .getByRole("link", { name: "02 Connection puzzle", exact: false })
    .press("Enter");
  await expect(
    page.locator('nav[aria-label="Main navigation"] a[href="#lab"]'),
  ).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#connection-game")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Expand workspace", exact: true })
    .click();
  expect(
    await page.locator("#connection-game").evaluate((el) => el.inert),
  ).toBe(true);
  expect(await page.locator("#motion-studio").evaluate((el) => el.inert)).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  expect(
    await page.locator("#connection-game").evaluate((el) => el.inert),
  ).toBe(false);
  await expect(
    page.getByRole("button", { name: "Expand workspace", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toHaveValue("600");
});
