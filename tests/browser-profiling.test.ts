import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";

const helpers = await import(
  new URL("../scripts/browser-profiling.mjs", import.meta.url).href
);
test("sampling diagnostics stop every started sampler on success and failures", async () => {
  for (const fail of [
    undefined,
    "Profiler.enable",
    "Profiler.start",
    "measure",
    "HeapProfiler.startSampling",
    "Profiler.stop",
    "HeapProfiler.stopSampling",
  ]) {
    const commands: string[] = [];
    const cdp = {
      send: async (command: string) => {
        commands.push(command);
        if (command === fail) throw new Error(fail);
        return { profile: { marker: command } };
      },
    };
    const capture = () =>
      helpers.sampleProfiles(cdp, async () => {
        if (fail === "measure") throw new Error("measure");
        return { paints: 5 };
      });
    if (fail) await assert.rejects(capture, AggregateError);
    else assert.equal((await capture()).sample.paints, 5);
    const cpuStarted = fail !== "Profiler.enable" && fail !== "Profiler.start";
    assert.equal(commands.includes("Profiler.stop"), cpuStarted);
    assert.equal(
      commands.includes("HeapProfiler.stopSampling"),
      cpuStarted && fail !== "HeapProfiler.startSampling",
    );
  }
});
test("profiling percentiles tolerate empty windows and preserve input order", () => {
  const values = [3, 1, 2];
  assert.equal(helpers.percentile(values, 0.5), 2);
  assert.deepEqual(values, [3, 1, 2]);
  assert.equal(helpers.percentile([], 0.95), 0);
});

test("frame diagnostics bound retained samples and report overflow instead of hiding it", () => {
  const callbacks: ((time: number) => void)[] = [];
  const context = {
    requestAnimationFrame: (callback: (time: number) => void) => {
      callbacks.push(callback);
      return callbacks.length;
    },
    performance: { now: () => 1 },
  };
  const result = runInNewContext(
    `
    class CanvasRenderingContext2D {
      canvas={matches:selector=>selector==='#test'};
      clearRect(){} putImageData(){}
    }
    globalThis.CanvasRenderingContext2D=CanvasRenderingContext2D;
    (${helpers.installFrameProbe.toString()})('#test');
    __frameProfile.recording=true;
    for(let i=0;i<10100;i++)requestAnimationFrame(()=>new CanvasRenderingContext2D().clearRect());
    globalThis.__frameProfile;
  `,
    context,
  );
  for (const callback of callbacks) callback(1);
  assert.equal(result.durations.length, 10000);
  assert.equal(result.times.length, 10000);
  assert.equal(result.droppedFrames, 100);
  assert.equal(result.paints, 10100);
});

test("completed and failed frame captures release page-side sample arrays", async () => {
  for (const fail of [false, true]) {
    const profile = {
      durations: [],
      times: [],
      paints: 0,
      droppedFrames: 0,
      recording: false,
    };
    const context = {
      __frameProfile: profile,
      performance: { now: () => 1 },
      setTimeout: (callback: () => void) => {
        Object.assign(profile, { durations: [2, 3], times: [4, 5], paints: 2 });
        if (fail) throw new Error("timer failed");
        callback();
      },
    };
    const page = {
      evaluate: (callback: (duration: number) => unknown, duration: number) =>
        runInNewContext(`(${callback.toString()})(${duration})`, context),
    };
    const capture = () => helpers.measureFrames(page, 1);
    if (fail) await assert.rejects(capture, /timer failed/);
    else {
      const result = await capture();
      assert.deepEqual(Array.from(result.durations), [2, 3]);
      assert.deepEqual(Array.from(result.times), [4, 5]);
      assert.equal(result.recording, false);
    }
    assert.equal(profile.recording, false);
    assert.equal(profile.durations.length, 0);
    assert.equal(profile.times.length, 0);
  }
});
