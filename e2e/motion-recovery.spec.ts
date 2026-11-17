import { expect, test } from "@playwright/test";

type RecoveryWindow = Window & { restoreAnimation(): void };

for (const failure of ["missing", "first", "second", "cancel"] as const) {
  test(`Motion Studio recovers from ${failure} animation support with a truthful static result`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: failure === "second" || failure === "cancel" ? 390 : 1440,
      height: 1000,
    });
    await page.emulateMedia({
      reducedMotion: "no-preference",
      colorScheme:
        failure === "missing" || failure === "second" ? "light" : "dark",
    });
    await page.addInitScript((mode) => {
      const animate = Element.prototype.animate;
      let calls = 0;
      Object.defineProperty(window, "restoreAnimation", {
        value: () => {
          Element.prototype.animate = animate;
        },
      });
      if (mode === "missing") {
        Object.defineProperty(Element.prototype, "animate", {
          configurable: true,
          writable: true,
          value: undefined,
        });
        return;
      }
      Element.prototype.animate = function (...args) {
        if (!this.matches(".motion-runner")) return animate.apply(this, args);
        calls++;
        if (
          (mode === "first" && calls === 1) ||
          (mode === "second" && calls === 2)
        )
          throw new DOMException(
            "Animation unavailable in test",
            "NotSupportedError",
          );
        const animation = animate.apply(this, args);
        animation.pause();
        return animation;
      };
    }, failure);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#motion-studio");
    const play = page.locator(".motion-play");
    await play.press("Enter");
    if (failure === "cancel") {
      await expect(page.locator(".motion-feedback")).toHaveText(
        "Comparing both curves…",
      );
      await page
        .locator(".motion-runner")
        .first()
        .evaluate((node) => node.getAnimations()[0].cancel());
    }
    await expect(page.locator(".motion-feedback")).toHaveText(
      "Animation is unavailable. Both end states are shown.",
    );
    await expect(page.locator(".motion-runner.has-arrived")).toHaveCount(2);
    expect(
      await page
        .locator(".motion-runner")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAnimations().length),
        ),
    ).toEqual([0, 0]);
    await expect(play).toBeFocused();
    await expect(play).toHaveText("Play motion ↗");
    expect(errors).toEqual([]);
    await page.evaluate(() =>
      (window as unknown as RecoveryWindow).restoreAnimation(),
    );
    await play.press("Enter");
    await expect(page.locator(".motion-feedback")).toHaveText(
      "Comparing both curves…",
    );
    await expect(page.locator(".motion-feedback")).toHaveText(
      "Both arrived together. Try another curve.",
    );
  });
}

test("cancelling an older run cannot replace the active replay with a fallback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#motion-studio");
  await page.locator(".motion-play").evaluate((element) => {
    const play = element as HTMLButtonElement;
    play.click();
    play.click();
    document
      .querySelectorAll(".motion-runner")
      .forEach((node) =>
        node.getAnimations().forEach((animation) => animation.pause()),
      );
  });
  await expect(page.locator(".motion-feedback")).toHaveText(
    "Comparing both curves…",
  );
  await page.getByRole("button", { name: "Steady", exact: true }).click();
  await expect(page.locator(".motion-feedback")).toContainText(
    "Ready when you are",
  );
  expect(
    await page
      .locator(".motion-runner")
      .evaluateAll((nodes) => nodes.map((node) => node.getAnimations().length)),
  ).toEqual([0, 0]);
});
