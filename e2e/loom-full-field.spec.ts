import { test, expect } from "@playwright/test";
import {
  loomViewport,
  projectLoomPoint,
} from "../src/features/playground/gravity-loom/viewport";

for (const width of [320, 1440])
  for (const theme of ["light", "dark"]) {
    test(`points and artwork reach all four corners at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/#gravity-loom");
      const exhibit = page.locator("#gravity-loom");
      const field = exhibit.getByRole("group", {
        name: "Interactive gravity field",
      });
      await expect(field).toBeVisible();
      await field.scrollIntoViewIfNeeded();
      const box = await field.boundingBox();
      if (!box) throw new Error("Missing field");
      const initial = projectLoomPoint(
        { x: -0.36, y: 0 },
        loomViewport(box.width - 2, box.height - 2),
      );
      let handle = initial;
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        // Re-grab the visible handle, not clipped rounded-corner pixels.
        await page.mouse.move(box.x + 1 + handle.x, box.y + 1 + handle.y);
        await page.mouse.down();
        await page.mouse.move(
          box.x + (x < 0 ? 2 : box.width - 2),
          box.y + (y < 0 ? 2 : box.height - 2),
          { steps: 2 },
        );
        await page.mouse.up();
        await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
          `horizontal ${x * 100}%, vertical ${y * 100}%`,
        );
        // Inspect actual painted marker pixels, not just the model/readout.
        const painted = await exhibit.locator("canvas").evaluate(
          (node, corner) => {
            const canvas = node as HTMLCanvasElement;
            const context = canvas.getContext("2d");
            if (!context) return false;
            const ratio = canvas.width / canvas.getBoundingClientRect().width;
            const cx =
              (corner.x < 0 ? 24 : canvas.getBoundingClientRect().width - 24) *
              ratio;
            const cy =
              (corner.y < 0 ? 24 : canvas.getBoundingClientRect().height - 24) *
              ratio;
            const pixels = context.getImageData(
              Math.round(cx - 6 * ratio),
              Math.round(cy - 6 * ratio),
              Math.ceil(12 * ratio),
              Math.ceil(12 * ratio),
            ).data;
            for (let i = 0; i < pixels.length; i += 4)
              if (
                pixels[i + 3] > 60 &&
                pixels[i] > pixels[i + 1] * 1.2 &&
                pixels[i + 1] > pixels[i + 2] * 1.2
              )
                return true;
            return false;
          },
          { x, y },
        );
        expect(painted).toBe(true);
        handle = projectLoomPoint(
          { x, y },
          loomViewport(box.width - 2, box.height - 2),
        );
      }
      await expect(field).toHaveAttribute("data-playing", "false");
      await exhibit.screenshot({
        path: `artifacts/loom-full-field-${theme}-${width}.png`,
      });
    });
  }

test("canvas-free artwork reaches the edge and keeps its position when the rectangle resizes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const field = exhibit.getByRole("group", {
    name: "Interactive gravity field",
  });
  await expect(exhibit.locator("svg circle").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await field.scrollIntoViewIfNeeded();
  const box = await field.boundingBox();
  if (!box) throw new Error("Missing field");
  const handle = projectLoomPoint(
    { x: -0.36, y: 0 },
    loomViewport(box.width - 2, box.height - 2),
  );
  await page.mouse.move(box.x + 1 + handle.x, box.y + 1 + handle.y);
  await page.mouse.down();
  await expect(field).toHaveAttribute("data-dragging", "true");
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
  await page.mouse.up();
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal 100%, vertical 100%",
  );
  for (const width of [320, 1440, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 1000 });
    await expect
      .poll(async () => {
        const circle = await exhibit
          .locator("svg circle")
          .first()
          .boundingBox();
        const rect = await field.boundingBox();
        if (!circle || !rect) return false;
        return (
          Math.abs(circle.x + circle.width / 2 - (rect.x + rect.width - 25)) <
            2 &&
          Math.abs(circle.y + circle.height / 2 - (rect.y + rect.height - 25)) <
            2
        );
      })
      .toBe(true);
  }
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
});
