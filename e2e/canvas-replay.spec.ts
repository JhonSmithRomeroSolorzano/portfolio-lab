import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import {
  captureCanvasCommands,
  drawingInputs,
  readCanvasCommands,
  replayCanvasCommands,
} from "./helpers/canvas-replay";

for (const sample of [1, 2, 3])
  test(`isolated canvas restoration replays identical drawing inputs, sample ${sample}`, async ({
    page,
    browser,
  }, info) => {
    await captureCanvasCommands(page);
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#gravity-loom");
    const release = await page.request.get("/release.json");
    expect(release.ok()).toBe(true);
    const { source: sourceCommit } = (await release.json()) as {
      source: string;
    };
    const canvas = page.locator("#gravity-loom canvas");
    await expect(canvas).toBeVisible();
    const flush = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
    await flush();
    const beforeCapture = await readCanvasCommands(page);
    const beforeIndex = beforeCapture.frames.length - 1;
    const sourceBefore = beforeCapture.pixels;
    await page.evaluate(() => {
      for (const theme of ["dark", "light", "dark"]) {
        document.documentElement.dataset.theme = theme;
        window.dispatchEvent(new Event("resize"));
      }
    });
    await flush();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width))
      .not.toBe(318);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    await expect
      .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width))
      .toBe(318);
    await flush();
    const capture = await readCanvasCommands(page);
    const afterIndex = capture.frames.length - 1;
    const sourceAfter = capture.pixels;
    const before = capture.frames[beforeIndex];
    const after = capture.frames[afterIndex];
    const digest = (value: unknown) =>
      createHash("sha256").update(JSON.stringify(value)).digest("hex");
    const beforeHash = digest(drawingInputs(before));
    const afterHash = digest(drawingInputs(after));
    await info.attach("canvas-replay-inputs.json.gz", {
      body: gzipSync(
        JSON.stringify({
          sourceCommit,
          browser: info.project.name,
          retry: info.retry,
          sample,
          beforeIndex,
          afterIndex,
          capture: { frames: capture.frames, overflow: capture.overflow },
        }),
      ),
      contentType: "application/gzip",
    });
    for (const [label, pixels] of [
      ["before", sourceBefore],
      ["after", sourceAfter],
    ])
      await info.attach(`canvas-replay-source-${label}`, {
        body: Buffer.from(pixels.split(",")[1], "base64"),
        contentType: "image/png",
      });
    // The capture page may affect timing. Its observation is not a substitute
    // for the unchanged application's pixel test, which runs independently.
    await page.close();
    const observations: Record<string, unknown> = {
      sample,
      browserVersion: browser.version(),
      beforeHash,
      afterHash,
      beforeRawHash: digest(before.commands),
      afterRawHash: digest(after.commands),
      overflow: capture.overflow,
      sourcePixelsEqual: sourceBefore === sourceAfter,
      beforeSize: [before.width, before.height],
      afterSize: [after.width, after.height],
      beforeBox: beforeCapture.box,
      afterBox: capture.box,
    };
    const results: { mode: string; before: string; after: string }[] = [];
    for (const mode of [
      "repeat-light",
      "source-history",
      "fresh-canvas",
    ] as const) {
      const isolatedContext = await browser.newContext();
      try {
        const isolated = await isolatedContext.newPage();
        const result = await replayCanvasCommands(
          isolated,
          mode === "repeat-light" ? [before, before] : capture.frames,
          mode === "repeat-light" ? 0 : beforeIndex,
          mode === "repeat-light" ? 1 : afterIndex,
          mode === "fresh-canvas",
        );
        results.push({ mode, ...result });
        observations[mode] = { pixelsEqual: result.before === result.after };
        for (const label of ["before", "after"] as const)
          await info.attach(`canvas-replay-${mode}-${label}`, {
            body: Buffer.from(result[label].split(",")[1], "base64"),
            contentType: "image/png",
          });
      } finally {
        await isolatedContext.close();
      }
    }
    await info.attach("canvas-replay-observations", {
      body: JSON.stringify(observations, null, 2),
      contentType: "application/json",
    });
    expect(capture.overflow, "capture must not silently truncate inputs").toBe(
      false,
    );
    expect(
      beforeHash,
      "restoration must use identical captured drawing inputs",
    ).toBe(afterHash);
    for (const result of results)
      expect(result.after, result.mode).toBe(result.before);
  });
