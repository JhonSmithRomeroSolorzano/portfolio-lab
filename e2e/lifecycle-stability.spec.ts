import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { openSync, writeFileSync, closeSync } from "node:fs";
import {
  installLifecycleProbe,
  readLifecycleSnapshot,
  type LifecycleSnapshot,
} from "./helpers/lifecycle-probe";

const cycles = Number(process.env.LIFECYCLE_CYCLES ?? 6);
if (!Number.isInteger(cycles) || cycles < 6 || cycles > 60)
  throw new Error("LIFECYCLE_CYCLES must be an integer from 6 to 60.");

async function settle(page: Page) {
  await page.locator("#resume").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator("[data-playing=true]")
        .evaluateAll((nodes) => nodes.map((node) => node.className)),
    )
    .toEqual([]);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __lifecycleProbe: { snapshot(): { pendingFrames: number } };
            }
          ).__lifecycleProbe.snapshot().pendingFrames,
      ),
    )
    .toBe(0);
}

for (const width of [390, 1440])
  test(`warm lifecycle resources stay bounded through repeated journeys at ${width}px`, async ({
    page,
    browserName,
  }, info) => {
    test.setTimeout(120_000 + cycles * 15_000);
    page.setDefaultTimeout(10_000);
    await page.addInitScript(installLifecycleProbe);
    await page.emulateMedia({
      reducedMotion: "no-preference",
      colorScheme: "light",
    });
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#jet-engine");
    const release = await (await page.request.get("/release.json")).json();
    const exhibits = [
      ["jet-engine", ".jet-engine", ".engine-stage"],
      ["gravity-loom", ".loom-stage", ".loom-stage"],
      ["signal-sculpture", ".sculpture-stage", ".sculpture-stage"],
    ];
    const sample = () => page.evaluate(readLifecycleSnapshot);
    const journey = async () => {
      for (const [id, state, stage] of exhibits) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.locator(`#${id} ${stage}`).scrollIntoViewIfNeeded();
        await expect(page.locator(`#${id} ${state}`)).toHaveAttribute(
          "data-playing",
          "true",
        );
        await expect
          .poll(async () => (await sample()).pendingFrames)
          .toBeGreaterThan(0);
        if (id === "jet-engine") {
          await page
            .getByRole("button", { name: /^Full power 100%/ })
            .press("Enter");
          await page
            .getByRole("button", { name: "Reverse thrust", exact: true })
            .press("Enter");
          await page.locator(`#${id} ${stage}`).scrollIntoViewIfNeeded();
          await expect(page.locator(".engine-canvas")).toHaveAttribute(
            "data-reverser",
            "1.000",
          );
          await page
            .getByRole("button", { name: "Reverse thrust", exact: true })
            .press("Enter");
        }
        await page
          .getByRole("button", { name: /Switch to (dark|light) theme/ })
          .click();
        await page.locator(`#${id} ${stage}`).scrollIntoViewIfNeeded();
      }
      for (const id of [
        "motion-studio",
        "connection-game",
        "cache-rescue",
        "algorithm-garden",
      ]) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await expect(page.locator(`#${id} button`).first()).toBeVisible();
        if (id === "motion-studio")
          await page
            .getByRole("button", { name: /Play motion/ })
            .press("Enter");
        if (id === "cache-rescue") {
          await page
            .locator(`#${id}`)
            .getByRole("button", { name: "Reset", exact: true })
            .press("Enter");
          await page
            .getByRole("button", { name: /Send the crowd/ })
            .press("Enter");
        }
      }
      await page.setViewportSize({ width: 844, height: 390 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator("html")).toHaveAttribute(
        "data-motion",
        "reduce",
      );
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
      if (
        await page
          .getByRole("button", { name: "Switch to light theme" })
          .count()
      )
        await page
          .getByRole("button", { name: "Switch to light theme" })
          .press("Enter");
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: "Résumé", exact: true })
        .press("Enter");
      await settle(page);
    };
    // Lazy imports, bounded geometry/guide caches, and font loading are warmup,
    // not leaks. All comparisons return to the same viewport/theme/section.
    await journey();
    await journey();
    const baseline = await sample();
    const cdp =
      browserName === "chromium"
        ? await page.context().newCDPSession(page)
        : undefined;
    if (cdp) await cdp.send("Performance.enable");
    const heapSnapshot = async (label: string) => {
      if (!cdp || process.env.LIFECYCLE_HEAP_SNAPSHOTS !== "1") return;
      // Stream diagnostic chunks directly to disk instead of retaining the
      // complete snapshot plus a second joined copy in the test runner heap.
      const file = openSync(info.outputPath(`${label}.heapsnapshot`), "w");
      let writeError: unknown;
      const chunk = (event: { chunk: string }) => {
        if (writeError) return;
        try {
          writeFileSync(file, event.chunk);
        } catch (error) {
          writeError = error;
        }
      };
      cdp.on("HeapProfiler.addHeapSnapshotChunk", chunk);
      try {
        await cdp.send("HeapProfiler.takeHeapSnapshot");
        if (writeError) throw writeError;
      } finally {
        cdp.off("HeapProfiler.addHeapSnapshotChunk", chunk);
        closeSync(file);
      }
    };
    const memory = async () => {
      if (!cdp) return null;
      await cdp.send("HeapProfiler.collectGarbage");
      const { metrics } = await cdp.send("Performance.getMetrics");
      return {
        ...(await cdp.send("Memory.getDOMCounters")),
        ...(await cdp.send("Runtime.getHeapUsage")),
        heapUsed: metrics.find((metric) => metric.name === "JSHeapUsedSize")
          ?.value,
      };
    };
    const samples = [{ cycle: 0, snapshot: baseline, memory: await memory() }];
    await heapSnapshot("warm");
    for (let cycle = 1; cycle <= cycles; cycle++) {
      await journey();
      const current = await sample();
      samples.push({ cycle, snapshot: current, memory: await memory() });
      // One-shot reveal targets may unobserve after warmup. Released resources
      // are fine; new categories or a growing count are not.
      for (const [key, count] of Object.entries(current.resources))
        expect(count, `${key} after cycle ${cycle}`).toBeLessThanOrEqual(
          baseline.resources[key] ?? 0,
        );
      expect(current.intervals).toBe(baseline.intervals);
      expect(current.automaticListeners).toBe(baseline.automaticListeners);
    }
    const before = await sample();
    await page.waitForTimeout(300);
    const after = await sample();
    expect(after.paints).toBe(before.paints);
    expect(after.pendingFrames).toBe(0);
    expect(errors).toEqual([]);
    await heapSnapshot("final");
    const report = JSON.stringify(
      {
        browserName,
        browserVersion: page.context().browser()?.version(),
        release,
        width,
        simulated: true,
        samples,
      },
      null,
      2,
    );
    const reportPath = info.outputPath("lifecycle-samples.json");
    await writeFile(reportPath, report);
    await info.attach("lifecycle-samples", {
      path: reportPath,
      contentType: "application/json",
    });
  });

test("lifecycle counters detect and release deliberately retained resources", async ({
  page,
}) => {
  await page.addInitScript(installLifecycleProbe);
  await page.goto("/", { waitUntil: "load" });
  const result = await page.evaluate(() => {
    const probe = (
      window as unknown as {
        __lifecycleProbe: { snapshot(): LifecycleSnapshot };
      }
    ).__lifecycleProbe;
    const before = probe.snapshot();
    const listener = () => {};
    window.addEventListener("probe-event", listener);
    window.addEventListener("probe-event", listener);
    const observer = new ResizeObserver(() => {});
    observer.observe(document.body);
    observer.observe(document.body);
    const frame = requestAnimationFrame(() => {}),
      timer = setInterval(() => {}, 60_000);
    const retained = probe.snapshot();
    window.removeEventListener("probe-event", listener);
    observer.disconnect();
    observer.disconnect();
    cancelAnimationFrame(frame);
    clearInterval(timer);
    return { before, retained, after: probe.snapshot() };
  });
  expect(result.retained.resources["window:probe-event:false"]).toBe(1);
  expect(result.retained.resources["ResizeObserver:active"]).toBe(
    (result.before.resources["ResizeObserver:active"] ?? 0) + 1,
  );
  expect(result.retained.pendingFrames).toBe(result.before.pendingFrames + 1);
  expect(result.retained.intervals).toBe(result.before.intervals + 1);
  expect(result.after).toEqual(result.before);
});

test("stack tour releases its interval when a batched intersection ends offscreen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super(
          (entries, observer) =>
            callback(
              entries.flatMap((entry) => {
                if (!entry.target.matches(".stack-drawing")) return [entry];
                return [
                  {
                    target: entry.target,
                    time: entry.time - 1,
                    rootBounds: entry.rootBounds,
                    boundingClientRect: entry.boundingClientRect,
                    intersectionRect: entry.intersectionRect,
                    isIntersecting: !entry.isIntersecting,
                    intersectionRatio: entry.isIntersecting ? 0 : 1,
                  },
                  entry,
                ];
              }),
              observer,
            ),
          options,
        );
      }
    };
  });
  await page.addInitScript(installLifecycleProbe);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const stage = page.locator(".stack-drawing");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  await expect(stage).not.toBeInViewport();
  await expect(stage).toHaveAttribute("data-playing", "false");
  await expect
    .poll(async () => (await page.evaluate(readLifecycleSnapshot)).intervals)
    .toBe(0);
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect
    .poll(async () => (await page.evaluate(readLifecycleSnapshot)).intervals)
    .toBe(1);
});
