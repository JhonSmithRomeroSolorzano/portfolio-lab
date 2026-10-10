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
  await page.getByRole("button", { name: "Next puzzle", exact: false }).click();
  await expect(page.getByLabel("Choose a puzzle")).toHaveValue("1");
  await expect(tiles.nth(0)).toBeFocused();
  await tiles.nth(0).press("Space");
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
  await expect(runner).toHaveCount(2);
  expect(
    await runner.evaluateAll((nodes) =>
      nodes.map((el) => el.getAnimations().length),
    ),
  ).toEqual([0, 0]);
  await page.getByRole("button", { name: "Play motion", exact: false }).click();
  await expect(page.locator(".motion-feedback")).toHaveText(
    "Comparing both curves…",
  );
  await expect(runner).toHaveClass([/has-arrived/, /has-arrived/]);
  await page
    .getByRole("button", { name: "A little bounce", exact: true })
    .click();
  await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(0);
  await page.getByRole("button", { name: "Play motion", exact: false }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Show end state", exact: true }),
  ).toBeVisible();
  expect(
    await runner.evaluateAll((nodes) =>
      nodes.map((el) => el.getAnimations().length),
    ),
  ).toEqual([0, 0]);
  await page
    .getByRole("button", { name: "Show end state", exact: true })
    .click();
  await expect(runner).toHaveClass([/has-arrived/, /has-arrived/]);
});

test("optional hints describe one move without playing it and support keyboard follow-through", async ({
  page,
}) => {
  await page.goto("/#connection-game");
  const hint = page.getByRole("button", {
    name: "Give me a hint",
    exact: true,
  });
  await hint.press("Enter");
  await expect(page.locator(".route-hint")).toContainText("row 1, column 1");
  await expect(page.locator(".route-score")).toContainText("0 turns");
  await page
    .getByRole("button", { name: "Go to hinted tile", exact: false })
    .press("Enter");
  const tile = page.getByRole("button", { name: /Row 1, column 1:/ });
  await expect(tile).toBeFocused();
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("1 turn");
  await expect(page.locator(".route-hint [role=status]")).toBeEmpty();
  await hint.press("Enter");
  await expect(page.locator(".route-hint")).toContainText("row 1, column 2");
  await page.getByLabel("Choose a puzzle").selectOption("2");
  await expect(page.locator(".route-hint [role=status]")).toBeEmpty();
});

test("puzzle progress survives reload and switching without resetting another board", async ({
  page,
}) => {
  await page.goto("/#connection-game");
  const tiles = page
    .getByRole("group", { name: "Connection puzzle", exact: true })
    .getByRole("button");
  await tiles.nth(0).click();
  const changed = await tiles.nth(0).getAttribute("aria-label");
  await page.reload();
  await expect(tiles.nth(0)).toHaveAttribute("aria-label", changed!);
  await expect(page.locator(".route-score")).toContainText("1 turn");
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Choose a puzzle").selectOption("1");
  await tiles.nth(4).click();
  const second = await tiles.nth(4).getAttribute("aria-label");
  await page.reload();
  await expect(page.getByLabel("Choose a puzzle")).toHaveValue("1");
  await expect(tiles.nth(4)).toHaveAttribute("aria-label", second!);
  await page.getByLabel("Choose a puzzle").selectOption("0");
  await expect(tiles.nth(0)).toHaveAttribute("aria-label", changed!);
  await page.getByRole("button", { name: "Start again", exact: true }).click();
  await page.reload();
  await expect(page.locator(".route-score")).toContainText("0 turns");
  await page.getByLabel("Choose a puzzle").selectOption("1");
  await expect(tiles.nth(4)).toHaveAttribute("aria-label", second!);
});

test("a failed puzzle save gives honest feedback without breaking play or undo", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "jsr-connection-progress-v1")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.goto("/#connection-game");
  const tile = page.getByRole("button", { name: /Row 1, column 1:/ });
  const original = await tile.getAttribute("aria-label");
  await tile.click();
  await expect(page.locator(".route-save")).toContainText("this visit only");
  await expect(page.locator(".route-score")).toContainText("1 turn");
  await page.getByRole("button", { name: "Undo turn", exact: true }).click();
  await expect(tile).toHaveAttribute("aria-label", original!);
  await expect(tile).toBeFocused();
});

test("motion comparison shares a clock and duration, and control changes cancel both lanes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Enter through the page so initial hash restoration cannot steal focus mid-click.
  await page.goto("/");
  await page
    .getByRole("link", { name: /Motion studio/, exact: false })
    .press("Enter");
  await expect(page.locator("#motion-studio")).toBeFocused();
  const duration = page.getByRole("slider", { name: /Duration/ });
  await duration.fill("1800");
  const play = page.getByRole("button", { name: "Play motion", exact: false });
  await play.click();
  await expect(page.locator(".motion-feedback")).toHaveText(
    "Comparing both curves…",
  );
  const timing = await page.locator(".motion-runner").evaluateAll((nodes) =>
    nodes.map((node) => {
      const animation = node.getAnimations()[0];
      return {
        start: animation?.startTime,
        duration: animation?.effect?.getTiming().duration,
        easing: animation?.effect?.getTiming().easing,
      };
    }),
  );
  expect(timing).toHaveLength(2);
  expect(typeof timing[0].start).toBe("number");
  expect(timing[0].start).toBe(timing[1].start);
  expect(timing.map((t) => t.duration)).toEqual([1800, 1800]);
  expect(timing[0].easing).not.toBe(timing[1].easing);
  await page.getByRole("button", { name: "Steady", exact: true }).click();
  await expect(page.locator(".motion-feedback")).toContainText(
    "Ready when you are",
  );
  expect(
    await page
      .locator(".motion-runner")
      .evaluateAll((nodes) => nodes.map((node) => node.getAnimations().length)),
  ).toEqual([0, 0]);
  await play.click();
  await duration.fill("600");
  await expect(page.locator(".motion-feedback")).toContainText(
    "Ready when you are",
  );
  await play.click();
  await expect(page.locator(".motion-feedback")).toContainText(
    "Both arrived together",
  );
  await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(2);
});

test("four peer experiences replace the dropdown and old Signal Lab anchor reaches the collection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lab=api#signal-lab");
  await expect(page).toHaveURL(/#lab$/);
  await expect(page.getByLabel("Choose a lab", { exact: true })).toHaveCount(0);
  const links = page
    .getByRole("navigation", { name: "Explore the collection" })
    .getByRole("link");
  await expect(links).toHaveCount(4);
  await expect(page.locator("#lab > article")).toHaveCount(4);
  for (const [index, id] of [
    "cache-rescue",
    "connection-game",
    "motion-studio",
    "algorithm-garden",
  ].entries()) {
    await links.nth(index).press("Enter");
    await expect(page.locator(`#${id}`)).toBeFocused();
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(
      page.locator('nav[aria-label="Main navigation"] a[href="#lab"]'),
    ).toHaveAttribute("aria-current", "location");
  }
  await expect(page.getByText("WORK IN PROGRESS", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "See the roadmap", exact: false }),
  ).toHaveCount(0);
});
