import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {
  rescueRun,
  rescueSnapshot,
} from "../src/domain/playground/cache-rescue";
import { ROUNDS } from "../src/features/playground/cache-rescue/rounds";
import type {
  CacheProbeState,
  CacheProbeWindow,
} from "./fixtures/cache-rescue-probe";

type FrameState = {
  pending: number;
  peak: number;
  scheduled: number;
  delivered: number;
  canceled: number;
};
type PlaybackWindow = CacheProbeWindow & { cacheFrames(): FrameState };

let fixture: string;
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL("./fixtures/cache-rescue-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "cache-playback-probe",
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw new Error("Missing fixture bundle");
  const entry = output.output.find(
    (item) => item.type === "chunk" && item.isEntry,
  );
  if (!entry || entry.type !== "chunk")
    throw new Error("Missing fixture entry");
  fixture = entry.code;
});

async function openProbe(page: Page) {
  const start = new Date("2026-01-01T00:00:00Z");
  // Install before navigation/wrapping time APIs; keep rendering live during load.
  await page.clock.install({ time: start });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/__cache-playback", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="cache-probe"></div>',
    }),
  );
  await page.goto("/__cache-playback#cache-rescue");
  await page.evaluate(() => {
    // Observe the actual hook's clock-controlled frame ownership, without
    // replacing callbacks or delivering canceled work.
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    let peak = 0,
      scheduled = 0,
      delivered = 0,
      canceled = 0;
    window.requestAnimationFrame = (callback) => {
      const id = request((now) => {
        pending.delete(id);
        delivered++;
        callback(now);
      });
      pending.add(id);
      scheduled++;
      peak = Math.max(peak, pending.size);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      if (pending.delete(id)) canceled++;
      cancel(id);
    };
    Object.assign(window, {
      cacheFrames: () => ({
        pending: pending.size,
        peak,
        scheduled,
        delivered,
        canceled,
      }),
    });
  });
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByTestId("cache-state")).toBeVisible();
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await expect.poll(async () => (await state(page)).reduced).toBe(false);
  expect(await frames(page)).toEqual({
    pending: 0,
    peak: 0,
    scheduled: 0,
    delivered: 0,
    canceled: 0,
  });
}
async function state(page: Page): Promise<CacheProbeState> {
  return JSON.parse((await page.getByTestId("cache-state").textContent())!);
}
const frames = (page: Page) =>
  page.evaluate(() => (window as PlaybackWindow).cacheFrames());
async function play(page: Page) {
  expect(
    await page.evaluate(() =>
      (window as CacheProbeWindow).cacheRescueProbe.play(),
    ),
  ).toBe(true);
  await expect.poll(async () => (await state(page)).playing).toBe(true);
  await expect.poll(async () => (await frames(page)).pending).toBe(1);
}
async function stopped(page: Page) {
  await expect.poll(async () => (await state(page)).playing).toBe(false);
  await expect.poll(async () => (await frames(page)).pending).toBe(0);
  const before = await state(page);
  const clock = await frames(page);
  await page.clock.runFor(4000);
  expect(await state(page)).toEqual(before);
  expect(await frames(page)).toEqual(clock);
}
async function checkModel(page: Page) {
  const current = await state(page);
  const expected = rescueRun(ROUNDS[current.round], current.shared);
  expect(current.run).toEqual(expected);
  expect(current.counts).toEqual(rescueSnapshot(expected, current.time));
  return current;
}

test("rapid pause/resume, completion and relaunch retain one frame chain", async ({
  page,
}) => {
  await openProbe(page);
  for (let cycle = 0; cycle < 5; cycle++) {
    await play(page);
    await page.clock.runFor(48);
    expect((await checkModel(page)).time).toBeGreaterThan(0);
    await page.evaluate(() =>
      (window as CacheProbeWindow).cacheRescueProbe.play(),
    );
    await stopped(page);
  }
  await play(page);
  await page.clock.runFor(3500);
  await expect.poll(async () => (await state(page)).finished).toBe(true);
  await stopped(page);
  await play(page);
  expect((await state(page)).time).toBe(0);
  expect((await state(page)).finished).toBe(false);
  await page.clock.runFor(48);
  expect((await checkModel(page)).time).toBeGreaterThan(0);
  await page.clock.runFor(3500);
  await expect.poll(async () => (await state(page)).finished).toBe(true);
  await stopped(page);
  expect((await frames(page)).peak).toBe(1);
  expect((await frames(page)).canceled).toBeGreaterThanOrEqual(7);
});

for (const action of ["reset", "round", "strategy"] as const) {
  test(`${action} changes release old frames before explicit relaunch`, async ({
    page,
  }) => {
    await openProbe(page);
    for (let cycle = 0; cycle < 3; cycle++) {
      await play(page);
      await page.clock.runFor(48);
      const previous = await checkModel(page);
      await page.evaluate(
        ({ action, cycle }) => {
          const probe = (window as CacheProbeWindow).cacheRescueProbe;
          if (action === "round") probe.round((cycle + 1) % 3);
          else if (action === "strategy") probe.strategy(cycle % 2 === 0);
          else probe.reset();
        },
        { action, cycle },
      );
      await expect.poll(async () => (await state(page)).time).toBe(-25);
      await stopped(page);
      const current = await checkModel(page);
      expect(current.round).toBe(
        action === "round" ? (cycle + 1) % 3 : previous.round,
      );
      expect(current.shared).toBe(
        action === "strategy" ? cycle % 2 === 0 : previous.shared,
      );
      expect(current.finished).toBe(false);
    }
    await play(page);
    await page.clock.runFor(3500);
    await expect.poll(async () => (await state(page)).finished).toBe(true);
    await stopped(page);
    await checkModel(page);
    expect((await frames(page)).peak).toBe(1);
  });
}

test("navigation and unmount stop frames without restarting on return", async ({
  page,
}) => {
  await openProbe(page);
  await play(page);
  await page.clock.runFor(48);
  const running = await state(page);
  await page.evaluate(() => {
    location.hash = "#resume";
  });
  await stopped(page);
  expect((await state(page)).time).toBe(running.time);
  await page.evaluate(() => {
    location.hash = "#cache-rescue";
  });
  await stopped(page);
  await play(page);
  await page.clock.runFor(48);
  expect((await checkModel(page)).time).toBeGreaterThan(running.time);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.unmount(),
  );
  await expect(page.getByTestId("cache-state")).toHaveCount(0);
  await expect.poll(async () => (await frames(page)).pending).toBe(0);
  const before = await frames(page);
  await page.clock.runFor(4000);
  expect(await frames(page)).toEqual(before);
  expect(before.peak).toBe(1);
});

test("motion changes cancel frames and reduced playback completes without scheduling", async ({
  page,
}) => {
  await openProbe(page);
  await play(page);
  await page.clock.runFor(48);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await state(page)).reduced).toBe(true);
  await stopped(page);
  const before = await frames(page);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.play(),
  );
  await expect.poll(async () => (await state(page)).finished).toBe(true);
  await stopped(page);
  expect(await frames(page)).toEqual(before);
  await checkModel(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => (await state(page)).reduced).toBe(false);
  await stopped(page);
  await play(page);
  expect((await state(page)).time).toBe(0);
  await page.clock.runFor(3500);
  await expect.poll(async () => (await state(page)).finished).toBe(true);
  await stopped(page);
  expect((await frames(page)).peak).toBe(1);
});
