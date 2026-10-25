import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:4183/");
if (!["http:", "https:"].includes(target.protocol))
  throw new Error("Provide an HTTP(S) production preview URL.");
target.hash = "jet-engine";
const label = process.argv[3] ?? "profile";
if (!/^[a-z\d-]+$/i.test(label))
  throw new Error("Use a simple alphanumeric profile label.");
const referenceLabel = process.argv[4];
if (referenceLabel && !/^[a-z\d-]+$/i.test(referenceLabel))
  throw new Error("Use a simple alphanumeric reference label.");
if (referenceLabel === label)
  throw new Error("Output and reference labels must differ.");
const directory = "artifacts/engine-performance";
await mkdir(directory, { recursive: true });
const release = JSON.parse(await readFile("dist/release.json", "utf8"));
const servedResponse = await fetch(new URL("release.json", target));
if (!servedResponse.ok)
  throw new Error("The preview release manifest is unavailable.");
const served = await servedResponse.json();
const fingerprint = (value) => JSON.stringify(Object.entries(value).sort());
if (fingerprint(release.files) !== fingerprint(served.files))
  throw new Error(
    "The preview is not serving the current local production build.",
  );
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
  "engine-depth.json",
]) {
  sourceHashes[file] = createHash("sha256")
    .update(await readFile(`src/features/playground/jet-engine/${file}`))
    .digest("hex");
}
const browser = await chromium.launch();
const results = [];
const snapshots = [];
const percentile = (values, ratio) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * ratio))
  ] ?? 0;
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
    await page.addInitScript(() => {
      const root = globalThis,
        nativeFrame = root.requestAnimationFrame.bind(root);
      const nativePaint = root.CanvasRenderingContext2D.prototype.putImageData;
      let active;
      root.__engineProfile = {
        recording: false,
        durations: [],
        times: [],
        paints: 0,
      };
      root.CanvasRenderingContext2D.prototype.putImageData = function (
        ...args
      ) {
        if (this.canvas.matches(".engine-canvas")) {
          if (active) active.painted = true;
          if (root.__engineProfile.recording) root.__engineProfile.paints++;
        }
        return nativePaint.apply(this, args);
      };
      root.requestAnimationFrame = (callback) =>
        nativeFrame((time) => {
          const sample = { painted: false },
            start = root.performance.now();
          active = sample;
          try {
            callback(time);
          } finally {
            active = undefined;
            if (sample.painted && root.__engineProfile.recording) {
              root.__engineProfile.durations.push(
                root.performance.now() - start,
              );
              root.__engineProfile.times.push(time);
            }
          }
        });
    });
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
    const measure = async (milliseconds) =>
      page.evaluate(async (duration) => {
        const root = globalThis,
          profile = root.__engineProfile;
        profile.durations = [];
        profile.times = [];
        profile.paints = 0;
        const start = root.performance.now();
        profile.recording = true;
        await new Promise((resolve) => root.setTimeout(resolve, duration));
        profile.recording = false;
        return {
          durations: profile.durations,
          times: profile.times,
          paints: profile.paints,
          elapsed: root.performance.now() - start,
        };
      }, milliseconds);
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
        if (sample.durations.length < 5)
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
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
      await cdp.send("HeapProfiler.startSampling", {
        samplingInterval: 32768,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      });
      await page.waitForTimeout(2000);
      const { profile: cpu } = await cdp.send("Profiler.stop");
      const { profile: heap } = await cdp.send("HeapProfiler.stopSampling");
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
    allJsBytesSaved: reference.bundle.allJsGzip - bundle.allJsGzip,
    engineJsBytesSaved: reference.bundle.engineJsGzip - bundle.engineJsGzip,
  };
}
await writeFile(
  `${directory}/${label}.json`,
  JSON.stringify(
    {
      label,
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
if (comparison) {
  console.log(JSON.stringify(comparison));
  if (comparison.changedStills.length)
    throw new Error(
      "Composite engine stills changed from the performance reference.",
    );
}
