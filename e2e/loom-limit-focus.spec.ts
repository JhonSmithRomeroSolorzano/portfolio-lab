import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  for (const limit of ["full", "empty"] as const) {
    test(`loom retains keyboard focus at the ${limit} attractor limit at ${width}px`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: width === 390 ? "dark" : "light",
        reducedMotion: width === 390 ? "reduce" : "no-preference",
      });
      await page.goto("/?review=loom-limits#gravity-loom");
      const exhibit = page.locator("#gravity-loom");
      const stage = exhibit.locator(".loom-stage");
      if (width === 1280) {
        await exhibit
          .getByRole("button", { name: "Pause", exact: true })
          .press("Enter");
      }
      await exhibit
        .getByText("Move a point without dragging", { exact: true })
        .press("Enter");
      const points = exhibit
        .getByRole("group", { name: "Controlled attractor" })
        .getByRole("button");
      await expect(points).toHaveCount(2);
      const add = exhibit.getByRole("button", {
        name: "Add attractor",
        exact: true,
      });
      const remove = exhibit.getByRole("button", {
        name: "Remove last",
        exact: true,
      });
      const action = limit === "full" ? add : remove;
      await action.press("Enter");
      await action.press("Space");
      await expect(points).toHaveCount(limit === "full" ? 4 : 0);
      await expect(action).toBeDisabled();
      await expect(action).toBeFocused();
      await expect(action).toBeInViewport();
      await expect(stage).toHaveAttribute("data-playing", "false");
      const feedback = await exhibit.getByRole("status").innerText();

      // Disabled semantics must also refuse keyboard and dispatched activation.
      await action.press("Enter");
      await action.press("Space");
      await action.dispatchEvent("click");
      await expect(points).toHaveCount(limit === "full" ? 4 : 0);
      await expect(exhibit.getByRole("status")).toHaveText(feedback);
      await expect(action).toBeFocused();
      await expect(stage).toHaveAttribute("data-playing", "false");

      // Native Tab still advances, and the opposite action enables this one again.
      const tab =
        browserName === "webkit" && process.platform === "darwin"
          ? "Alt+Tab"
          : "Tab";
      await action.press(tab);
      if (limit === "full") await expect(remove).toBeFocused();
      else
        await expect(
          exhibit.locator(".loom-fine-controls summary"),
        ).toBeFocused();
      await (limit === "full" ? remove : add).press("Enter");
      await expect(action).toBeEnabled();
      await action.press("Enter");
      await expect(points).toHaveCount(limit === "full" ? 4 : 0);
      await expect(action).toBeFocused();
      await expect(page).toHaveURL(/\?review=loom-limits#gravity-loom$/);
    });
  }
}
