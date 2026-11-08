import { expect, test } from "@playwright/test";

for (const width of [390, 1280])
  for (const phase of ["resize soak", "palette epochs"] as const)
    test(`paused live Loom preserves pixels and resources through ${phase} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1100 });
      await page.emulateMedia({
        reducedMotion: "no-preference",
        colorScheme: "light",
      });
      await page.addInitScript(() => {
        localStorage.setItem("portfolio-theme", "light");
        const sources = new Set<HTMLCanvasElement>();
        let copies = 0,
          paints = 0;
        const nativeClear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (
          ...args: number[]
        ) {
          if (this.canvas.closest("#gravity-loom")) {
            sources.add(this.canvas);
            paints++;
          }
          return Reflect.apply(nativeClear, this, args);
        };
        const native = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function (
          ...args: unknown[]
        ) {
          if (this.canvas.closest("#gravity-loom")) {
            copies++;
          }
          return Reflect.apply(native, this, args);
        };
        Object.assign(window, {
          loomResources: () => ({
            allocated: sources.size,
            active: [...sources].filter((c) => c.width > 0 && c.height > 0)
              .length,
            attached: [...sources].filter((c) => c.isConnected).length,
            pixels: [...sources].reduce(
              (sum, c) => sum + c.width * c.height,
              0,
            ),
            copies,
            paints,
          }),
        });
      });
      await page.goto("/#gravity-loom");
      const stage = page.locator("#gravity-loom .loom-stage");
      const canvas = stage.locator("canvas");
      const pixels = () =>
        canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
      const resources = () =>
        page.evaluate(() =>
          (
            window as unknown as {
              loomResources: () => {
                allocated: number;
                active: number;
                attached: number;
                pixels: number;
                copies: number;
                paints: number;
              };
            }
          ).loomResources(),
        );
      const flush = () =>
        page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
      await expect(stage).toHaveAttribute("data-playing", "true");
      const preview = await pixels();
      await expect.poll(pixels).not.toBe(preview);
      await page
        .locator("#gravity-loom")
        .getByRole("button", { name: "Pause", exact: true })
        .press("Enter");
      await flush();
      const paused = await pixels();
      const before = await resources();
      expect(before.active).toBe(1);
      expect(before.attached).toBe(1);
      expect(before.allocated).toBe(1);
      expect(before.copies).toBe(0);
      // Keep both stress cases intact, but give each its own normal test budget.
      // On software-rendered WebKit, 120 real frames alone can consume ~18 seconds.
      if (phase === "resize soak") {
        await page.evaluate(async () => {
          for (let i = 0; i < 120; i++) {
            window.dispatchEvent(new Event("resize"));
            await new Promise(requestAnimationFrame);
          }
        });
        expect(await resources()).toEqual(before);
        expect(await pixels()).toBe(paused);
      }
      if (phase === "palette epochs") {
        for (let cycle = 0; cycle < 3; cycle++) {
          await page.evaluate(() => {
            document.documentElement.dataset.theme = "dark";
          });
          await flush();
          expect(await pixels()).not.toBe(paused);
          await page.setViewportSize({
            width: width === 390 ? 844 : 1000,
            height: 600,
          });
          await flush();
          await page.setViewportSize({ width, height: 1100 });
          await page.evaluate(() => {
            document.documentElement.dataset.theme = "light";
          });
          await flush();
          expect(await pixels()).toBe(paused);
          await expect(stage).toHaveAttribute("data-playing", "false");
          const after = await resources();
          expect(after.allocated).toBe(before.allocated + (cycle + 1) * 2);
          expect(after.active).toBe(1);
          expect(after.attached).toBe(1);
          expect(after.pixels).toBe(before.pixels);
        }
      }
      // Resizing can move the field offscreen; resume from the focused field so
      // viewport suspension is not mistaken for a lost manual playback request.
      await stage.scrollIntoViewIfNeeded();
      await stage.focus();
      await stage.press("Space");
      await expect(stage).toHaveAttribute("data-playing", "true");
      await expect.poll(pixels).not.toBe(paused);
      expect((await resources()).allocated).toBe(
        before.allocated + (phase === "palette epochs" ? 6 : 0),
      );
      expect((await resources()).copies).toBe(0);
    });

test("Loom renews only its canvas during a held drag, preserving stage and pointer capture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  await page.goto("/#gravity-loom");
  const stage = page.locator("#gravity-loom .loom-stage");
  const canvas = stage.locator("canvas");
  await expect(canvas).toBeVisible();
  await expect(stage).toHaveAttribute("data-playing", "true");
  await stage.evaluate((node) => {
    Object.assign(window, {
      loomStage: node,
      loomEpoch: node.querySelector("canvas"),
    });
  });
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = window as unknown as { loomEpoch: HTMLCanvasElement };
        return saved.loomEpoch.isConnected;
      }),
    )
    .toBe(false);
  expect(
    await stage.evaluate((node) => {
      const saved = window as unknown as {
        loomStage: HTMLElement;
        loomEpoch: HTMLCanvasElement;
      };
      return {
        sameStage: saved.loomStage === node,
        released: saved.loomEpoch.width === 0 && saved.loomEpoch.height === 0,
        captured: node.hasPointerCapture(1),
        canvases: node.querySelectorAll("canvas").length,
      };
    }),
  ).toEqual({ sameStage: true, released: true, captured: true, canvases: 1 });
  await expect(stage).toHaveAttribute("data-dragging", "true");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.mouse.move(
    box.x + box.width / 2 + 40,
    box.y + box.height / 2 + 20,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await expect(page.locator("#gravity-loom").getByRole("status")).toContainText(
    "moved",
  );
});

test("Loom renewal denial releases the old canvas and retains usable SVG controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/#gravity-loom");
  const stage = page.locator("#gravity-loom .loom-stage");
  await expect(stage.locator("canvas")).toBeVisible();
  await page.evaluate(() => {
    const old = document.querySelector(
      "#gravity-loom canvas",
    ) as HTMLCanvasElement;
    Object.assign(window, { loomRetired: old });
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: unknown[]
    ) {
      // Allocation happens before attachment. Existing visible contexts remain usable.
      if (!this.isConnected && args[0] === "2d") return null;
      return Reflect.apply(native, this, args);
    } as typeof native;
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  });
  await expect(stage.locator("canvas")).toHaveCount(0);
  await expect(stage.locator("svg")).toBeVisible();
  await expect(
    page
      .locator("#gravity-loom")
      .getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => {
      const old = (window as unknown as { loomRetired: HTMLCanvasElement })
        .loomRetired;
      return !old.isConnected && old.width === 0 && old.height === 0;
    }),
  ).toBe(true);
  await page
    .locator("#gravity-loom")
    .getByRole("button", { name: "Add attractor", exact: true })
    .click();
  await expect(stage.locator("svg circle")).toHaveCount(3);
});
