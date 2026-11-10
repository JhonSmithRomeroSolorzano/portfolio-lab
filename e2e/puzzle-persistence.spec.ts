import { test, expect, type Page } from "@playwright/test";
import {
  freshProgress,
  ROUTE_PROGRESS_KEY,
} from "../src/features/playground/connection-puzzle/route-progress";

type Faults = { denyReads: boolean; denyWrites: boolean; writes: number };
type FaultWindow = typeof window & { puzzleStorageFaults: Faults };

async function installFaults(page: Page) {
  await page.addInitScript((key) => {
    const faults = { denyReads: false, denyWrites: false, writes: 0 };
    Object.assign(window, { puzzleStorageFaults: faults });
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (name) {
      if (this === window.localStorage && name === key && faults.denyReads)
        throw new DOMException("Read denied", "SecurityError");
      return getItem.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (this === window.localStorage && name === key) {
        faults.writes++;
        if (faults.denyWrites)
          throw new DOMException("Full", "QuotaExceededError");
      }
      return setItem.call(this, name, value);
    };
  }, ROUTE_PROGRESS_KEY);
}

for (const [label, raw] of [
  ["malformed", "{bad"],
  ["unsupported", JSON.stringify({ ...freshProgress(), version: 99 })],
] as const) {
  test(`${label} initial saves remain untouched until explicit play`, async ({
    page,
  }) => {
    await installFaults(page);
    await page.goto("/");
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key: ROUTE_PROGRESS_KEY,
      raw,
    });
    await page.goto("/#connection-game");
    await expect(page.locator(".route-save")).toContainText(
      "could not be read",
    );
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        ROUTE_PROGRESS_KEY,
      ),
    ).toBe(raw);
    expect(
      await page.evaluate(
        () => (window as FaultWindow).puzzleStorageFaults.writes,
      ),
    ).toBe(1);
    await page.getByRole("button", { name: /Row 1, column 1:/ }).press("Space");
    await expect(page.locator(".route-score")).toContainText("1 turn");
    await expect(page.locator(".route-save")).toContainText("Progress saved");
    await page.reload();
    await expect(page.locator(".route-score")).toContainText("1 turn");
  });
}

test("recovering an identical readable save clears a stale read warning without writing", async ({
  page,
}) => {
  await installFaults(page);
  await page.goto("/");
  await page.evaluate(
    ({ key, progress }) => {
      localStorage.setItem(key, JSON.stringify(progress));
      (window as FaultWindow).puzzleStorageFaults.denyReads = true;
    },
    { key: ROUTE_PROGRESS_KEY, progress: freshProgress() },
  );
  await page.goto("/#connection-game");
  await expect(page.locator(".route-save")).toContainText("this visit only");
  await page.evaluate(() => {
    (window as FaultWindow).puzzleStorageFaults.denyReads = false;
    window.dispatchEvent(new Event("focus"));
  });
  await expect(page.locator(".route-save")).toContainText("Progress saved");
  await expect(page.locator(".route-score")).toContainText("0 turns");
  expect(
    await page.evaluate(
      () => (window as FaultWindow).puzzleStorageFaults.writes,
    ),
  ).toBe(1);
});

test("quota recovery keeps unsaved turns and Undo until an explicit successful retry", async ({
  page,
}) => {
  await installFaults(page);
  await page.goto("/#connection-game");
  const tile = page.getByRole("button", { name: /Row 1, column 1:/ });
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("1 turn");
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    ROUTE_PROGRESS_KEY,
  );
  await page.evaluate(() => {
    (window as FaultWindow).puzzleStorageFaults.denyWrites = true;
  });
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("2 turns");
  await expect(page.locator(".route-save")).toContainText("this visit only");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".route-save")).toContainText("this visit only");
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), ROUTE_PROGRESS_KEY),
  ).toBe(saved);
  await page.evaluate(() => {
    (window as FaultWindow).puzzleStorageFaults.denyWrites = false;
  });
  // Recovery alone neither writes nor claims that the unsaved turn persisted.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".route-save")).toContainText("this visit only");
  await tile.press("Space");
  await expect(page.locator(".route-score")).toContainText("3 turns");
  await expect(page.locator(".route-save")).toContainText("Progress saved");
  await page.reload();
  await expect(page.locator(".route-score")).toContainText("3 turns");
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
});

test("delayed conflicting saves replace unsaved local work before accepting a retry", async ({
  page,
  context,
}) => {
  await installFaults(page);
  await page.addInitScript(() => {
    for (const type of ["storage", "focus"])
      window.addEventListener(
        type,
        (event) => event.stopImmediatePropagation(),
        true,
      );
  });
  await page.goto("/#connection-game");
  await page.getByLabel("Choose a puzzle").selectOption("1");
  const first = page.getByRole("button", { name: /Row 1, column 1:/ });
  const initial = await first.getAttribute("aria-label");
  await page.evaluate(() => {
    (window as FaultWindow).puzzleStorageFaults.denyWrites = true;
  });
  await first.press("Space");
  await page
    .getByRole("button", { name: "Give me a hint", exact: true })
    .press("Enter");
  await expect(page.locator(".route-hint [role=status]")).not.toBeEmpty();
  await expect(page.locator(".route-save")).toContainText("this visit only");

  const other = await context.newPage();
  await other.goto("/#connection-game");
  await other.getByRole("button", { name: /Row 1, column 2:/ }).press("Space");
  await expect(other.locator(".route-score")).toContainText("1 turn");
  const remoteSave = await other.evaluate(
    (key) => localStorage.getItem(key),
    ROUTE_PROGRESS_KEY,
  );
  await page.evaluate(() => {
    (window as FaultWindow).puzzleStorageFaults.denyWrites = false;
  });
  const attempted = page.getByRole("button", { name: /Row 1, column 3:/ });
  const before = await attempted.getAttribute("aria-label");
  const writes = await page.evaluate(
    () => (window as FaultWindow).puzzleStorageFaults.writes,
  );
  await attempted.press("Space");
  await expect(page.locator(".route-save")).toContainText(
    "try your action again",
  );
  await expect(page.getByLabel("Choose a puzzle")).toHaveValue("1");
  await expect(first).toHaveAttribute("aria-label", initial!);
  await expect(attempted).toHaveAttribute("aria-label", before!);
  await expect(page.locator(".route-hint [role=status]")).toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Undo turn", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => (window as FaultWindow).puzzleStorageFaults.writes,
    ),
  ).toBe(writes);
  expect(
    await other.evaluate(
      (key) => localStorage.getItem(key),
      ROUTE_PROGRESS_KEY,
    ),
  ).toBe(remoteSave);
  await attempted.press("Space");
  await expect(page.locator(".route-score")).toContainText("2 turns");
  await expect(other.locator(".route-score")).toContainText("2 turns");
  await other.close();
});
