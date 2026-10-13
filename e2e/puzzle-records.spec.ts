import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/features/playground/connection-puzzle/route-progress";
import { solvedBoard, rotateTile } from "../src/domain/playground/route-puzzle";

test("a completed attempt keeps its best after reset and reload", async ({
  page,
}) => {
  const progress = freshProgress();
  const tiles = solvedBoard(0);
  for (let i = 0; i < 3; i++) tiles[0] = rotateTile(tiles[0]);
  progress.boards[0] = { tiles, moves: 8, rotations: 10, assisted: false };
  await page.goto("/");
  await page.evaluate(
    (value) =>
      localStorage.setItem("jsr-connection-progress-v1", JSON.stringify(value)),
    progress,
  );
  await page.goto("/#connection-game");
  await page.getByText("Your puzzle records", { exact: true }).click();
  await page.getByRole("button", { name: /Row 1, column 1:/ }).press("Space");
  await expect(page.locator(".route-feedback")).toContainText(
    "Connection made",
  );
  await expect(page.locator(".route-records")).toContainText("11 rotations");
  await expect(page.locator(".route-records")).toContainText(
    "1 of 3 puzzles completed",
  );
  await page.getByRole("button", { name: "Start again", exact: true }).click();
  await page.reload();
  await page.getByText("Your puzzle records", { exact: true }).click();
  await expect(page.locator(".route-records")).toContainText("11 rotations");
  await expect(page.locator(".route-records")).toContainText(
    "This attempt: 0 rotations · unassisted",
  );
});
test("hints and rotation counts survive undo, reload, and tab synchronization", async ({
  page,
  context,
}) => {
  await page.goto("/#connection-game");
  const other = await context.newPage();
  await other.goto("/#connection-game");
  await page.getByRole("button", { name: /Row 1, column 1:/ }).press("Space");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  await page
    .getByRole("button", { name: "Give me a hint", exact: true })
    .click();
  await other.getByText("Your puzzle records", { exact: true }).click();
  await expect(other.locator(".route-records")).toContainText(
    "1 rotation · with hints",
  );
  await page.getByRole("button", { name: "Undo turn", exact: true }).click();
  await page.reload();
  await page.getByText("Your puzzle records", { exact: true }).click();
  await expect(page.locator(".route-score")).toContainText("0 turns");
  await expect(page.locator(".route-records")).toContainText(
    "1 rotation · with hints",
  );
  await other.close();
});
