import { readFile } from "node:fs/promises";
/** Shared test/diagnostic helpers; never imported by the application. */
export async function verifyPreviewBuild(target) {
  const local = JSON.parse(await readFile("dist/release.json", "utf8"));
  const response = await fetch(new URL("release.json", target), {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Preview manifest unavailable.");
  const served = await response.json();
  const files = (value) =>
    value?.version === 1 &&
    value.files &&
    typeof value.files === "object" &&
    !Array.isArray(value.files) &&
    Object.keys(value.files).length > 0;
  const fingerprint = (value) =>
    JSON.stringify(Object.entries(value.files).sort());
  if (
    !files(local) ||
    !files(served) ||
    fingerprint(local) !== fingerprint(served)
  )
    throw new Error("Preview does not match the local build.");
  return local;
}
export const percentile = (values, ratio) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * ratio))
  ] ?? 0;

/** Serializable init script. Counts one draw per clear/upload, not every particle. */
export function installFrameProbe(selector) {
  const root = globalThis,
    nativeFrame = root.requestAnimationFrame.bind(root);
  const profile = {
    recording: false,
    durations: [],
    times: [],
    paints: 0,
    droppedFrames: 0,
  };
  root.__frameProfile = profile;
  let painted = false;
  for (const method of ["clearRect", "putImageData"]) {
    const native = root.CanvasRenderingContext2D.prototype[method];
    root.CanvasRenderingContext2D.prototype[method] = function (...args) {
      if (this.canvas.matches(selector)) {
        painted = true;
        if (profile.recording) profile.paints++;
      }
      return Reflect.apply(native, this, args);
    };
  }
  root.requestAnimationFrame = (callback) =>
    nativeFrame((time) => {
      const outer = painted;
      painted = false;
      const start = root.performance.now();
      try {
        callback.call(root, time);
      } finally {
        if (painted && profile.recording) {
          if (profile.durations.length < 10000) {
            profile.durations.push(root.performance.now() - start);
            profile.times.push(time);
          } else profile.droppedFrames++;
        }
        painted = outer;
      }
    });
}

export async function measureFrames(page, milliseconds) {
  return page.evaluate(async (duration) => {
    const p = globalThis.__frameProfile;
    p.durations = [];
    p.times = [];
    p.paints = 0;
    p.droppedFrames = 0;
    const start = performance.now();
    p.recording = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, duration));
      return { ...p, recording: false, elapsed: performance.now() - start };
    } finally {
      p.recording = false;
      // The returned sample owns these arrays; idle pages need not retain them
      // until another capture (and failed captures should release them too).
      p.durations = [];
      p.times = [];
    }
  }, milliseconds);
}

/** Stop every sampler that started, including when measurement/another stop fails. */
export async function sampleProfiles(cdp, measure) {
  let cpuStarted = false,
    heapStarted = false,
    cpu,
    heap,
    sample;
  const errors = [];
  try {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
    cpuStarted = true;
    await cdp.send("HeapProfiler.startSampling", {
      samplingInterval: 32768,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true,
    });
    heapStarted = true;
    sample = await measure();
  } catch (error) {
    errors.push(error);
  } finally {
    if (cpuStarted)
      try {
        ({ profile: cpu } = await cdp.send("Profiler.stop"));
      } catch (error) {
        errors.push(error);
      }
    if (heapStarted)
      try {
        ({ profile: heap } = await cdp.send("HeapProfiler.stopSampling"));
      } catch (error) {
        errors.push(error);
      }
  }
  if (errors.length)
    throw new AggregateError(errors, "Sampling capture failed", {
      cause: errors[0],
    });
  return { cpu, heap, sample };
}
