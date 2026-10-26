import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("warm engine themes and revisits reuse artwork without full-body repeat transfers", async ({
  page,
  browserName,
}, info) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#jet-engine");
  const image = page.locator(".engine-stage img");
  const loaded = async () => {
    await expect
      .poll(() =>
        image.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
  };
  await loaded();
  const initialSource = await image.getAttribute("src");
  const toggle = page.getByRole("button", {
    name: /Switch to (dark|light) theme/,
  });
  await toggle.press("Enter");
  await expect(image).not.toHaveAttribute("src", initialSource!);
  await loaded();
  const start = await page.evaluate(() => performance.now());
  const cdp =
    browserName === "chromium"
      ? await page.context().newCDPSession(page)
      : undefined;
  const decode = { events: 0, milliseconds: 0 };
  if (cdp) {
    cdp.on("Tracing.dataCollected", ({ value }) => {
      for (const event of value)
        if (
          /decode.*image|image.*decode/i.test(event.name) &&
          typeof event.dur === "number"
        ) {
          decode.events++;
          decode.milliseconds += event.dur / 1000;
        }
    });
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline,disabled-by-default-devtools.timeline",
      transferMode: "ReportEvents",
    });
  }
  try {
    for (let i = 0; i < 8; i++) {
      const before = await image.getAttribute("src");
      await toggle.press("Enter");
      await expect(image).not.toHaveAttribute("src", before!);
      await loaded();
      await page.locator("#resume").scrollIntoViewIfNeeded();
      await page.locator(".engine-stage").scrollIntoViewIfNeeded();
      await loaded();
    }
  } finally {
    if (cdp) {
      const done = new Promise<void>((resolve) =>
        cdp.once("Tracing.tracingComplete", () => resolve()),
      );
      await cdp.send("Tracing.end");
      await done;
    }
  }
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => /engine-back-.*\.svg/.test(entry.name))
      .map((entry) => {
        const e = entry as PerformanceResourceTiming;
        return {
          url: new URL(e.name).pathname,
          start: e.startTime,
          transferBytes: e.transferSize,
          encodedBytes: e.encodedBodySize,
          durationMs: e.duration,
        };
      }),
  );
  expect(new Set(resources.map((r) => r.url)).size).toBe(2);
  const coldBytes = resources
    .filter((r) => r.start < start)
    .reduce((sum, r) => sum + r.transferBytes, 0);
  const warmBytes = resources
    .filter((r) => r.start >= start)
    .reduce((sum, r) => sum + r.transferBytes, 0);
  expect(coldBytes).toBeGreaterThan(0);
  // Permit header-only revalidation, but reject repeated SVG bodies. Do not
  // infer decoded/GPU retention or zero decode work from HTTP cache hits.
  expect(warmBytes).toBeLessThan(coldBytes);
  const report = info.outputPath("theme-cache.json");
  await writeFile(
    report,
    JSON.stringify(
      {
        browserName,
        coldBytes,
        warmBytes,
        decode: cdp ? decode : null,
        resources,
      },
      null,
      2,
    ),
  );
  await info.attach("theme-cache", {
    path: report,
    contentType: "application/json",
  });
});
