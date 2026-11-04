import { expect, test } from "@playwright/test";

const name = "Jhon Smith Romero.";

for (const theme of ["light", "dark"] as const) {
  for (const width of [375, 1440]) {
    test(`one background rain illuminates the name in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: "no-preference",
      });
      await page.clock.install({ time: new Date("2026-11-04T12:00:00Z") });
      await page.clock.pauseAt(new Date("2026-11-04T12:00:01Z"));
      await page.goto("/");
      const heading = page.getByRole("heading", {
        level: 1,
        name,
        exact: true,
      });
      await expect(heading).toHaveAttribute("data-name-renderer", "background");
      await expect(heading).toHaveAttribute("data-name-entrance", "running");
      await expect(heading.locator("canvas")).toHaveCount(0);
      await expect(page.locator("canvas:visible")).toHaveCount(1);
      await expect(page.locator("canvas.matrix-canvas")).toHaveCount(1);
      const before = await heading.boundingBox();
      const sample = () =>
        heading.evaluate((node) => ({
          time: Number((node as HTMLElement).dataset.nameTime),
          lit: Number((node as HTMLElement).dataset.nameIlluminated),
          count: Number((node as HTMLElement).dataset.nameSamples),
        }));
      await page.clock.runFor(1200);
      const early = await sample();
      expect(early.count).toBeGreaterThan(10);
      expect(early.lit).toBeGreaterThan(0);
      expect(early.lit).toBeLessThan(early.count * 0.2);
      await page.clock.runFor(1800);
      const forming = await sample();
      expect(forming.lit).toBeGreaterThan(early.lit);
      expect(forming.lit).toBeLessThan(forming.count);
      await page.clock.runFor(1800);
      await expect(heading).toHaveAttribute("data-name-entrance", "complete");
      expect((await sample()).lit).toBe((await sample()).count);
      expect(await heading.boundingBox()).toEqual(before);
      expect(await heading.textContent()).toBe(name);
      await expect(heading.locator(".name-letter-ink").first()).toHaveCSS(
        "opacity",
        "0",
      );
      await expect(page.locator(".workbench-intro")).toHaveAttribute(
        "data-name-surface",
        "cutout",
      );
      const first = await page
        .locator(".matrix-canvas")
        .evaluate((node: HTMLCanvasElement) => node.toDataURL());
      const time = (await sample()).time;
      await page.clock.runFor(1000);
      expect((await sample()).time).toBeGreaterThan(time);
      expect(
        await page
          .locator(".matrix-canvas")
          .evaluate((node: HTMLCanvasElement) => node.toDataURL()),
      ).not.toBe(first);
      await page.getByRole("button", { name: /Switch to .* theme/ }).click();
      await page.setViewportSize({ width: width + 10, height: 1000 });
      await page.clock.runFor(100);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.evaluate(() => {
        location.hash = "resume";
      });
      await page.evaluate(() => {
        location.hash = "workbench";
      });
      await page.clock.runFor(100);
      await expect(heading).toHaveAttribute("data-name-entrance", "complete");
      await expect(heading).toHaveAttribute("data-name-renderer", "background");
      await expect(heading.locator("canvas")).toHaveCount(0);
    });
  }
}

for (const mode of ["device", "saved", "deep-link"] as const) {
  test(`${mode} shows the illuminated name without replaying its introduction`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: mode === "device" ? "reduce" : "no-preference",
    });
    await page.addInitScript(
      (saved) =>
        localStorage.setItem("portfolio-motion", saved ? "reduce" : "system"),
      mode === "saved",
    );
    await page.goto(mode === "deep-link" ? "/#resume" : "/");
    const heading = page.locator("#intro-title");
    await expect(heading).toHaveAttribute("data-name-renderer", "background");
    await expect(heading).toHaveAttribute("data-name-entrance", "complete");
    await expect(heading).toHaveAttribute("data-name-playing", "false");
    expect(await heading.textContent()).toBe(name);
  });
}

test("revealing the name changes only brightness, not the background clock or unrelated pixels", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-11-04T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-04T12:00:01Z"));
  await page.goto("/");
  const heading = page.locator("#intro-title");
  await expect(heading).toHaveAttribute("data-name-renderer", "background");
  const sample = () =>
    page.locator(".matrix-canvas").evaluate((node: HTMLCanvasElement) => {
      const context = node.getContext("2d")!;
      const top = Array.from(context.getImageData(0, 0, node.width, 30).data);
      const all = Array.from(
        context.getImageData(0, 0, node.width, node.height).data,
      ).reduce((sum, value) => sum + value, 0);
      return { top, all, time: node.parentElement!.dataset.time };
    });
  const before = await sample();
  await page.keyboard.press("Tab");
  await expect(heading).toHaveAttribute("data-name-entrance", "complete");
  const after = await sample();
  expect(after.time).toBe(before.time);
  expect(after.top).toEqual(before.top);
  expect(after.all).toBeGreaterThan(before.all);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const still = await page
    .locator(".matrix-canvas")
    .evaluate((node: HTMLCanvasElement) => node.toDataURL());
  await page.clock.runFor(1500);
  expect(
    await page
      .locator(".matrix-canvas")
      .evaluate((node: HTMLCanvasElement) => node.toDataURL()),
  ).toBe(still);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(heading).toHaveAttribute("data-name-entrance", "complete");
  await page.reload();
  await expect(heading).toHaveAttribute("data-name-entrance", "running");
});

test("the semantic heading stays readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1, name, exact: true });
  await expect(heading).toBeVisible();
  await expect(heading.locator(".name-letter-ink").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator(".workbench-intro")).not.toHaveAttribute(
    "data-name-surface",
    "cutout",
  );
  await context.close();
});

test("canvas denial leaves the plain name and reading surface intact", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1, name, exact: true });
  await expect(heading).toHaveAttribute("data-name-entrance", "complete");
  await expect(heading.locator(".name-letter-ink").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator(".workbench-intro")).not.toHaveAttribute(
    "data-name-surface",
    "cutout",
  );
});

test("one background clock suspends for hidden tabs and Motion settings", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-11-04T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-04T12:00:01Z"));
  await page.goto("/");
  const heading = page.locator("#intro-title");
  const rain = page.locator(".matrix-canvas");
  await expect(heading).toHaveAttribute("data-name-renderer", "background");
  await page.clock.runFor(4800);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo({
          top:
            document.querySelector("#resume")!.getBoundingClientRect().top +
            scrollY,
          behavior: "instant",
        });
      }),
  );
  await page.clock.runFor(100);
  await expect(heading).toHaveAttribute("data-name-playing", "false");
  await expect(page.locator(".matrix-backdrop")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      }),
  );
  await page.clock.runFor(100);
  await expect(heading).toHaveAttribute("data-name-playing", "true");
  await expect(heading).toHaveAttribute("data-name-entrance", "complete");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await rain.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  await page.clock.runFor(1000);
  expect(
    await rain.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
  ).toBe(hidden);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(heading).toHaveAttribute("data-name-playing", "true");
  await page.locator(".motion-settings summary").press("Enter");
  await page.getByRole("radio", { name: "Reduce animation" }).check();
  await expect(heading).toHaveAttribute("data-name-playing", "false");
  const reduced = await rain.evaluate((node: HTMLCanvasElement) =>
    node.toDataURL(),
  );
  await page.clock.runFor(1000);
  expect(
    await rain.evaluate((node: HTMLCanvasElement) => node.toDataURL()),
  ).toBe(reduced);
  await expect(heading).toHaveAttribute("data-name-renderer", "background");
});
