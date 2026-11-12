import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  freshProgress,
  ROUTE_PROGRESS_KEY,
} from "../src/features/playground/connection-puzzle/route-progress";
import { rotateTile, solvedBoard } from "../src/domain/playground/route-puzzle";

async function activate(control: Locator) {
  await control.focus();
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeInViewport({ ratio: 1 });
  await control.press("Enter");
}

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test.describe(`${width}px ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: "reduce",
        });
      });

      test("static motion outcome updates the existing status without moving focus", async ({
        page,
      }) => {
        await page.goto("/#motion-studio");
        const status = page.locator(".motion-feedback");
        await expect(status).toHaveAttribute("role", "status");
        await expect(status).toContainText("Reduced motion is on");
        const show = page.getByRole("button", {
          name: "Show end state",
          exact: true,
        });
        await activate(show);
        await expect(status).toHaveText(
          "Both end states shown without animation. Try another curve.",
        );
        await expect(status).toHaveAttribute("aria-atomic", "true");
        await expect(show).toBeFocused();
        await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(2);
        expect(
          await page
            .locator(".motion-runner")
            .evaluateAll((nodes) =>
              nodes.every((node) => node.getAnimations().length === 0),
            ),
        ).toBe(true);
        const curve = page.getByRole("button", {
          name: "A little bounce",
          exact: true,
        });
        await activate(curve);
        await expect(curve).toHaveAttribute("aria-pressed", "true");
        await expect(curve).toBeFocused();
        await expect(status).toContainText("Reduced motion is on");
        await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(0);
      });

      test("prediction error is part of the input description and clears after correction", async ({
        page,
      }, info) => {
        await page.goto("/#cache-rescue");
        await activate(page.locator(".cache-prediction summary"));
        const input = page.getByRole("spinbutton", {
          name: "How many database reads?",
        });
        await expect(input).toHaveAccessibleDescription(/Optional\. Pick 1–24/);
        await input.fill("0");
        await activate(
          page.getByRole("button", {
            name: "Send & see the result",
            exact: true,
          }),
        );
        await expect(page.getByRole("alert")).toContainText(
          "whole number from 1 to 24",
        );
        await expect(input).toHaveAttribute("aria-invalid", "true");
        await expect(input).toHaveAccessibleDescription(
          /Optional\..*Use a whole number from 1 to 24/,
        );
        await expect(input).toBeFocused();
        await expect(input).toBeInViewport({ ratio: 1 });
        await page.screenshot({
          path: info.outputPath("prediction-error.png"),
        });
        const result = await new AxeBuilder({ page })
          .include("#cache-rescue")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(
          result.violations.map((violation) => ({
            id: violation.id,
            targets: violation.nodes.map((node) => node.target),
          })),
        ).toEqual([]);
        await input.fill("1");
        await expect(input).toHaveAttribute("aria-invalid", "false");
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(input).toHaveAttribute(
          "aria-describedby",
          "cache-prediction-help",
        );
        await expect(input).not.toHaveAccessibleDescription(
          /Use a whole number/,
        );
      });

      test("closed invalid prediction reopens for correction on every launch and preserves valid follow-up focus", async ({
        page,
      }) => {
        await page.goto("/#cache-rescue");
        const disclosure = page.locator(".cache-prediction");
        const summary = disclosure.locator("summary");
        const input = page.getByRole("spinbutton", {
          name: "How many database reads?",
        });
        const launch = page.getByRole("button", {
          name: "Send & see the result",
          exact: true,
        });
        await activate(summary);
        await input.fill("0");
        for (let attempt = 0; attempt < 2; attempt++) {
          await activate(summary);
          await expect(disclosure).not.toHaveAttribute("open", "");
          await activate(launch);
          await expect(disclosure).toHaveAttribute("open", "");
          await expect(page.getByRole("alert")).toBeVisible();
          await expect(input).toBeFocused();
          await expect(input).toBeInViewport({ ratio: 1 });
          await expect(page.locator(".cache-feedback")).toContainText(
            "Choose a strategy",
          );
        }
        await input.fill("1");
        await activate(launch);
        await expect(launch).toBeFocused();
        await expect(input).toBeDisabled();
        await expect(page.locator(".cache-feedback")).toContainText(
          "24 replies delivered",
        );
        await activate(page.getByRole("button", { name: /Next challenge/ }));
        await expect(launch).toBeFocused();
        await expect(input).toBeEnabled();
        await expect(launch).toBeInViewport({ ratio: 1 });
        const reset = page.locator(".cache-reset");
        await activate(reset);
        await expect(reset).toBeFocused();
      });

      test("garden visited states suppress repeat activation and reset retains keyboard focus", async ({
        page,
      }) => {
        await page.goto("/#algorithm-garden");
        const node = page.getByRole("button", { name: /^Node A/ });
        await activate(node);
        await expect(node).toHaveAccessibleName("Node A, visited 1");
        await expect(node).toHaveAttribute("aria-disabled", "true");
        await expect(node).toBeFocused();
        const feedback = page.locator(".garden-feedback");
        await expect(feedback).toHaveAttribute("role", "status");
        const message = await feedback.textContent();
        await node.press("Space");
        await expect(feedback).toHaveText(message!);
        const reset = page.getByRole("button", {
          name: "Reset garden",
          exact: true,
        });
        await activate(reset);
        await expect(reset).toBeFocused();
        await expect(node).toHaveAccessibleName("Node A");
        await expect(node).toHaveAttribute("aria-disabled", "false");
        await expect(feedback).toContainText("Start at A");
      });

      test("puzzle completion and next-step focus keep a single roving tile tab stop", async ({
        page,
      }) => {
        const initial = freshProgress();
        const tiles = solvedBoard(0);
        for (let i = 0; i < 3; i++) tiles[0] = rotateTile(tiles[0]);
        const progress = {
          ...initial,
          boards: initial.boards.map((board, index) =>
            index === 0
              ? { tiles, moves: 8, rotations: 10, assisted: false }
              : board,
          ),
        };
        await page.addInitScript(
          ({ key, progress }) =>
            localStorage.setItem(key, JSON.stringify(progress)),
          { key: ROUTE_PROGRESS_KEY, progress },
        );
        await page.goto("/#connection-game");
        const first = page.getByRole("button", { name: /Row 1, column 1:/ });
        await activate(first);
        await expect(
          page.locator(".route-feedback[role=status]"),
        ).toContainText("Connection made");
        await expect(first).toBeFocused();
        await expect(
          page.getByRole("button", { name: "Give me a hint", exact: true }),
        ).toBeDisabled();
        await activate(page.getByRole("button", { name: /Next puzzle/ }));
        await expect(page.getByLabel("Choose a puzzle")).toHaveValue("1");
        await expect(first).toBeFocused();
        await expect(page.locator('.route-tile[tabindex="0"]')).toHaveCount(1);
        await expect(
          page.getByRole("button", { name: "Give me a hint", exact: true }),
        ).toBeEnabled();
      });
    });
  }
}
