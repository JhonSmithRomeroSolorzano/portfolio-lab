import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import {
  installFrameProbe,
  measureFrames,
  percentile,
  sampleProfiles,
  verifyPreviewBuild,
} from "./browser-profiling.mjs";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:4173/");
if (!["http:", "https:"].includes(target.protocol))
  throw new Error("Provide an HTTP(S) preview URL.");
const label = process.argv[3] ?? "runtime";
if (!/^[a-z\d-]{1,64}$/i.test(label))
  throw new Error("Use an alphanumeric report label.");
const directory = "artifacts/runtime-diagnostics";
await mkdir(directory, { recursive: true });
const release = await verifyPreviewBuild(target);
const report = {
  label,
  status: "running",
  simulated: true,
  physicalDevice: false,
  safari: false,
  cpuSlowdown: 4,
  headful: process.env.RUNTIME_HEADFUL === "1",
  release,
  cases: [],
};
const browser = await chromium.launch({ headless: !report.headful });
report.browserVersion = browser.version();
let failure;
try {
  for (const theme of ["light", "dark"])
    for (const landscape of [false, true])
      for (const exhibit of [
        {
          id: "jet-engine",
          stage: ".engine-stage",
          state: ".jet-engine",
          pause: "Pause engine",
          play: "Play engine",
        },
        {
          id: "gravity-loom",
          stage: ".loom-stage",
          state: ".loom-stage",
          pause: "Pause",
          play: "Play",
        },
        {
          id: "signal-sculpture",
          stage: ".sculpture-stage",
          state: ".sculpture-stage",
          pause: "Pause",
          play: "Play",
        },
      ]) {
        const viewport = landscape
          ? { width: 844, height: 390 }
          : { width: 390, height: 844 };
        const context = await browser.newContext({
          viewport,
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          colorScheme: theme,
          reducedMotion: "no-preference",
        });
        try {
          const page = await context.newPage();
          page.setDefaultTimeout(15000);
          await page.addInitScript(installFrameProbe, `#${exhibit.id} canvas`);
          const cdp = await context.newCDPSession(page);
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
          await cdp.send("Performance.enable");
          const url = new URL(target);
          url.hash = exhibit.id;
          await page.goto(url.href);
          const stage = page.locator(exhibit.stage),
            section = page.locator(`#${exhibit.id}`);
          await stage.scrollIntoViewIfNeeded();
          const playing = async (value) =>
            page.waitForFunction(
              ({ selector, value }) =>
                document
                  .querySelector(selector)
                  ?.getAttribute("data-playing") === String(value),
              { selector: exhibit.state, value },
            );
          await playing(true);
          if (exhibit.id === "jet-engine") {
            await page
              .getByRole("button", { name: /^Full power 100%/ })
              .click();
            await stage.scrollIntoViewIfNeeded();
            await page.waitForFunction(
              () =>
                document.querySelector(".engine-canvas")?.dataset.spool ===
                "100.00",
            );
          }
          await page.waitForTimeout(500);
          const record = { id: exhibit.id, theme, viewport, states: [] };
          report.cases.push(record);
          const metrics = async () =>
            new Map(
              (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
                m.name,
                m.value,
              ]),
            );
          const measure = async (name) => {
            const before = await metrics(),
              sample = await measureFrames(page, 1500),
              after = await metrics();
            if (sample.droppedFrames)
              throw new Error("Frame probe capacity exceeded.");
            const result = {
              name,
              paints: sample.paints,
              fps: (sample.durations.length * 1000) / sample.elapsed,
              drawP50Ms: percentile(sample.durations, 0.5),
              drawP95Ms: percentile(sample.durations, 0.95),
              scriptMs:
                (after.get("ScriptDuration") - before.get("ScriptDuration")) *
                1000,
              taskMs:
                (after.get("TaskDuration") - before.get("TaskDuration")) * 1000,
              elapsedMs: sample.elapsed,
              visibility: await page.evaluate(() => document.visibilityState),
            };
            record.states.push(result);
            return result;
          };
          const active = await measure("active");
          if (active.paints < 5)
            throw new Error("Insufficient active canvas draws.");
          if (exhibit.id === "jet-engine") {
            await page
              .getByRole("button", { name: "Reverse thrust", exact: true })
              .click();
            await stage.scrollIntoViewIfNeeded();
            await page.waitForFunction(
              () =>
                document.querySelector(".engine-canvas")?.dataset.reverser ===
                "1.000",
            );
            await measure("active-reverse");
            await page
              .getByRole("button", { name: "Reverse thrust", exact: true })
              .click();
            await stage.scrollIntoViewIfNeeded();
            await page.waitForFunction(
              () =>
                document.querySelector(".engine-canvas")?.dataset.reverser ===
                "0.000",
            );
          }
          if (!landscape && theme === "light") {
            const profiles = await sampleProfiles(cdp, () =>
              measureFrames(page, 2000),
            );
            const bytes = profiles.heap.samples.reduce(
              (sum, s) => sum + s.size,
              0,
            );
            record.sampledAllocation = {
              bytes,
              paints: profiles.sample.paints,
              bytesPerPaint: bytes / Math.max(1, profiles.sample.paints),
            };
            await writeFile(
              `${directory}/${label}-${exhibit.id}.cpuprofile`,
              JSON.stringify(profiles.cpu),
            );
            await writeFile(
              `${directory}/${label}-${exhibit.id}.heapprofile`,
              JSON.stringify(profiles.heap),
            );
          }
          await section
            .getByRole("button", { name: exhibit.pause, exact: true })
            .click();
          await playing(false);
          await page.waitForTimeout(150);
          if ((await measure("manual-pause")).paints)
            throw new Error("Canvas work continues after Pause.");
          await section
            .getByRole("button", { name: exhibit.play, exact: true })
            .click();
          await stage.scrollIntoViewIfNeeded();
          await playing(true);
          await page.emulateMedia({ reducedMotion: "reduce" });
          await playing(false);
          await page.waitForTimeout(150);
          if ((await measure("reduced-motion")).paints)
            throw new Error("Canvas work continues under reduced motion.");
          await page.emulateMedia({ reducedMotion: "no-preference" });
          await stage.scrollIntoViewIfNeeded();
          await playing(true);
          await page.locator("#resume").scrollIntoViewIfNeeded();
          await playing(false);
          await page.waitForTimeout(150);
          if ((await measure("offscreen")).paints)
            throw new Error("Offscreen canvas keeps drawing.");
          await stage.scrollIntoViewIfNeeded();
          await playing(true);
          const other = await context.newPage();
          try {
            await cdp.send("Emulation.setFocusEmulationEnabled", {
              enabled: false,
            });
            const otherSession = await context.newCDPSession(other);
            await otherSession.send("Emulation.setFocusEmulationEnabled", {
              enabled: false,
            });
            await other.bringToFront();
            await other.waitForTimeout(250);
            const visibility = await page.evaluate(
              () => document.visibilityState,
            );
            if (visibility === "hidden") {
              await playing(false);
              await page.waitForTimeout(150);
              const hidden = await measure("native-hidden");
              if (hidden.paints)
                throw new Error("Browser-hidden canvas keeps drawing.");
            } else
              record.states.push({
                name: "native-hidden",
                supported: false,
                observedVisibility: visibility,
                reason:
                  "Automation kept the source document visible; no hidden CPU claim is made.",
              });
          } finally {
            await other.close();
            await page.bringToFront();
          }
          await page.emulateMedia({ reducedMotion: "reduce" });
          await playing(false);
          await cdp.send("HeapProfiler.collectGarbage");
          record.idleMemory = await cdp.send("Runtime.getHeapUsage");
          console.log(JSON.stringify(record));
        } finally {
          await context.close();
        }
      }
  report.status = "passed";
} catch (error) {
  failure = error;
  report.status = "failed";
  report.error = error.message;
} finally {
  await browser.close();
  await writeFile(
    `${directory}/${label}.json`,
    JSON.stringify(report, null, 2),
  );
}
if (failure) throw failure;
