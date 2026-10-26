import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import {
  installFrameProbe,
  measureFrames,
  percentile,
  sampleProfiles,
  verifyPreviewBuild,
} from "./browser-profiling.mjs";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:4183/");
if (!["http:", "https:"].includes(target.protocol))
  throw new Error("Provide an HTTP(S) production preview URL.");
target.hash = "jet-engine";
const label = process.argv[3] ?? "profile";
if (!/^[a-z\d-]{1,64}$/i.test(label))
  throw new Error("Use a simple alphanumeric profile label.");
const referenceLabel = process.argv[4];
if (referenceLabel && !/^[a-z\d-]{1,64}$/i.test(referenceLabel))
  throw new Error("Use a simple alphanumeric reference label.");
if (referenceLabel === label)
  throw new Error("Output and reference labels must differ.");
const directory = "artifacts/engine-performance";
await mkdir(directory, { recursive: true });
const release = await verifyPreviewBuild(target);
const files = await readdir("dist/assets");
const bundle = {
  allJsGzip: 0,
  entryJsGzip: 0,
  engineJsGzip: 0,
  auditMetadataInRuntime: false,
};
for (const file of files.filter((file) => file.endsWith(".js"))) {
  const bytes = await readFile(`dist/assets/${file}`),
    size = gzipSync(bytes).length;
  bundle.allJsGzip += size;
  if (/^index-/.test(file)) bundle.entryJsGzip += size;
  if (/^JetEngine-/.test(file)) {
    bundle.engineJsGzip = size;
    bundle.auditMetadataInRuntime = bytes.includes("legacyLayer");
  }
}
const sourceHashes = {};
for (const file of [
  "renderer.ts",
  "mesh.ts",
  "raster.ts",
  "tracers.ts",
  "engine-depth.json",
]) {
  sourceHashes[file] = createHash("sha256")
    .update(await readFile(`src/features/playground/jet-engine/${file}`))
    .digest("hex");
}
sourceHashes["domain/jet-engine.ts"] = createHash("sha256")
  .update(await readFile("src/domain/playground/jet-engine.ts"))
  .digest("hex");
const browser = await chromium.launch();
const results = [];
const snapshots = [];
let captureFailure;
try {
  for (const device of [
    { name: "mobile", width: 390, height: 844, dpr: 3, cpu: 4 },
    { name: "desktop", width: 1440, height: 1200, dpr: 2, cpu: 1 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.dpr,
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.addInitScript(installFrameProbe, ".engine-canvas");
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: device.cpu });
    await page.goto(target.href);
    await page.locator(".engine-canvas").waitFor({ state: "visible" });
    await page.getByRole("button", { name: /^Full power 100%/ }).click();
    await page.locator(".engine-stage").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        globalThis.document.querySelector(".engine-canvas")?.dataset.spool ===
        "100.00",
      null,
      { timeout: 30000 },
    );
    const measure = (milliseconds) => measureFrames(page, milliseconds);
    for (const mode of ["forward", "reverse"]) {
      if (mode === "reverse") {
        await page
          .getByRole("button", { name: "Reverse thrust", exact: true })
          .click();
        await page.locator(".engine-stage").scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () =>
            globalThis.document.querySelector(".engine-canvas")?.dataset
              .reverser === "1.000",
        );
      }
      await page.waitForTimeout(750);
      const runs = [];
      for (let run = 0; run < 3; run++) {
        await page.waitForFunction(
          () =>
            globalThis.document.querySelector(".jet-engine")?.dataset
              .playing === "true",
        );
        const sample = await measure(2500);
        if (sample.durations.length < 5 || sample.droppedFrames)
          throw new Error("Too few active engine frames to profile.");
        const intervals = sample.times
          .slice(1)
          .map((value, i) => value - sample.times[i]);
        runs.push({
          paints: sample.paints,
          fps: (sample.durations.length * 1000) / sample.elapsed,
          drawMedianMs: percentile(sample.durations, 0.5),
          drawP95Ms: percentile(sample.durations, 0.95),
          intervalP95Ms: percentile(intervals, 0.95),
        });
      }
      const {
        cpu,
        heap,
        sample: allocationFrames,
      } = await sampleProfiles(cdp, () => measure(2000));
      const names = new Map(
          cpu.nodes.map((node) => [
            node.id,
            node.callFrame.functionName || "(anonymous)",
          ]),
        ),
        costs = new Map();
      cpu.samples.forEach((id, i) => {
        const name = names.get(id);
        costs.set(name, (costs.get(name) || 0) + (cpu.timeDeltas[i] || 0));
      });
      const heapNames = new Map(),
        allocations = new Map();
      const visit = (node) => {
        heapNames.set(node.id, node.callFrame.functionName || "(anonymous)");
        node.children.forEach(visit);
      };
      visit(heap.head);
      for (const sample of heap.samples) {
        const name = heapNames.get(sample.nodeId);
        allocations.set(name, (allocations.get(name) || 0) + sample.size);
      }
      const record = {
        device,
        mode,
        runs,
        medianFps: percentile(
          runs.map((run) => run.fps),
          0.5,
        ),
        medianDrawMs: percentile(
          runs.map((run) => run.drawMedianMs),
          0.5,
        ),
        sampledAllocationBytes: heap.samples.reduce(
          (sum, sample) => sum + sample.size,
          0,
        ),
        allocationSamplePaints: allocationFrames.paints,
        sampledBytesPerPaint:
          heap.samples.reduce((sum, sample) => sum + sample.size, 0) /
          Math.max(1, allocationFrames.paints),
        hotAllocators: [...allocations]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, bytes]) => ({ name, bytes })),
        hotFunctions: [...costs]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([name, microseconds]) => ({
            name,
            milliseconds: microseconds / 1000,
          })),
      };
      results.push(record);
      await writeFile(
        `${directory}/${label}-${device.name}-${mode}.cpuprofile`,
        JSON.stringify(cpu),
      );
      await writeFile(
        `${directory}/${label}-${device.name}-${mode}.heapprofile`,
        JSON.stringify(heap),
      );
      console.log(JSON.stringify(record));
    }
    await page
      .getByRole("button", { name: "Pause engine", exact: true })
      .click();
    for (const state of ["paused", "reduced", "offscreen", "hidden"]) {
      if (state === "reduced") {
        await page
          .getByRole("button", { name: "Play engine", exact: true })
          .click();
        await page.locator(".engine-stage").scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () =>
            globalThis.document.querySelector(".jet-engine")?.dataset
              .playing === "true",
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      if (state === "offscreen") {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.waitForFunction(
          () =>
            globalThis.document.querySelector(".jet-engine")?.dataset
              .playing === "true",
        );
        await page.locator("#resume").scrollIntoViewIfNeeded();
      }
      if (state === "hidden") {
        await page.locator(".engine-stage").scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () =>
            globalThis.document.querySelector(".jet-engine")?.dataset
              .playing === "true",
        );
        await page.evaluate(() => {
          Object.defineProperty(globalThis.document, "hidden", {
            configurable: true,
            value: true,
          });
          globalThis.document.dispatchEvent(
            new globalThis.Event("visibilitychange"),
          );
        });
      }
      await page.waitForFunction(
        () =>
          globalThis.document.querySelector(".jet-engine")?.dataset.playing ===
          "false",
      );
      await page.waitForTimeout(100);
      const sample = await measure(750);
      if (sample.paints !== 0)
        throw new Error(
          `Unexpected continuous painting while ${state}: ${sample.paints}`,
        );
      results.push({ device: device.name, state, paints: sample.paints });
    }
    await context.close();
  }
  for (const width of [390, 1440])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 1200 },
        deviceScaleFactor: 3,
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(target.href);
      await page.locator(".engine-canvas").waitFor({ state: "visible" });
      for (const pose of ["off", "cruise", "reverse"]) {
        if (pose === "off")
          await page
            .getByRole("slider", { name: "Engine speed", exact: true })
            .press("Home");
        if (pose === "cruise")
          await page.getByRole("button", { name: /^Cruise 60%/ }).click();
        if (pose === "reverse") {
          await page.getByRole("button", { name: /^Full power 100%/ }).click();
          await page
            .getByRole("button", { name: "Reverse thrust", exact: true })
            .click();
        }
        const frame = await page
          .locator(".engine-stage")
          .evaluate(async (stage) => {
            const engine = stage.querySelector("canvas"),
              view = globalThis.document.createElement("canvas");
            view.width = engine.width;
            view.height = engine.height;
            const ctx = view.getContext("2d");
            ctx.drawImage(
              stage.querySelector("img"),
              0,
              0,
              view.width,
              view.height,
            );
            ctx.drawImage(engine, 0, 0);
            const hash = await globalThis.crypto.subtle.digest(
              "SHA-256",
              ctx.getImageData(0, 0, view.width, view.height).data,
            );
            return {
              width: view.width,
              height: view.height,
              sha256: [...new Uint8Array(hash)]
                .map((v) => v.toString(16).padStart(2, "0"))
                .join(""),
            };
          });
        snapshots.push({ viewport: width, theme, pose, ...frame });
      }
      await context.close();
    }
} catch (error) {
  captureFailure = error;
} finally {
  await browser.close();
}
let comparison;
if (referenceLabel) {
  const reference = JSON.parse(
    await readFile(`${directory}/${referenceLabel}.json`, "utf8"),
  );
  const changed = snapshots.filter(
    (frame, i) =>
      JSON.stringify(frame) !== JSON.stringify(reference.snapshots?.[i]),
  );
  comparison = {
    reference: referenceLabel,
    stillsCompared: snapshots.length,
    changedStills: changed,
    complete: snapshots.length === 12 && reference.snapshots?.length === 12,
    allJsBytesSaved: reference.bundle.allJsGzip - bundle.allJsGzip,
    engineJsBytesSaved: reference.bundle.engineJsGzip - bundle.engineJsGzip,
  };
}
const framesChanged =
  comparison && (comparison.changedStills.length > 0 || !comparison.complete);
await writeFile(
  `${directory}/${label}.json`,
  JSON.stringify(
    {
      label,
      status: captureFailure || framesChanged ? "failed" : "passed",
      error:
        captureFailure?.message ??
        (framesChanged
          ? "Composite engine still comparison failed."
          : undefined),
      browser: "Chromium",
      browserVersion: browser.version(),
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      simulatedCpuThrottling: true,
      syntheticHiddenEvent: true,
      bundle,
      release,
      sourceHashes,
      results,
      snapshots,
      comparison,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ label, bundle }));
if (captureFailure) throw captureFailure;
if (comparison) {
  console.log(JSON.stringify(comparison));
  if (comparison.changedStills.length || !comparison.complete)
    throw new Error(
      "Composite engine stills changed from the performance reference.",
    );
}
