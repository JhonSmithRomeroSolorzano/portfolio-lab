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

let fixture: string;
test.beforeAll(async () => {
  const model = fileURLToPath(
    new URL("../src/domain/playground/cache-rescue.ts", import.meta.url),
  );
  let instrumented = 0;
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [
      {
        name: "test-cache-model-call-count",
        enforce: "pre",
        transform(source, id) {
          if (id !== model) return;
          const marker =
            "  const { requests, originMs, spacingMs } = settings;";
          if (source.split(marker).length !== 2)
            throw new Error(
              "Expected exactly one rescueRun instrumentation point",
            );
          instrumented++;
          return source.replace(
            marker,
            `
          globalThis.cacheRescueRunCalls.push({ ...settings, coalesce });
${marker}`,
          );
        },
      },
    ],
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL("./fixtures/cache-rescue-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "cache-rescue-probe",
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw new Error("Missing fixture bundle");
  const entry = output.output.find(
    (item) => item.type === "chunk" && item.isEntry,
  );
  if (!entry || entry.type !== "chunk" || instrumented !== 1)
    throw new Error("Missing instrumented fixture entry");
  fixture = entry.code;
});

async function openProbe(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/__cache-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="cache-probe"></div>',
    }),
  );
  await page.goto("/__cache-probe#cache-rescue");
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByTestId("cache-state")).toBeVisible();
}
async function state(page: Page): Promise<CacheProbeState> {
  return JSON.parse((await page.getByTestId("cache-state").textContent())!);
}
const calls = (page: Page) =>
  page.evaluate(() => (window as CacheProbeWindow).cacheRescueRunCalls);

for (const action of ["round", "reset"] as const) {
  for (const phase of ["prediction error", "playback"] as const) {
    test(`invalid ${action} indices preserve ${phase} and valid challenge boundaries still work`, async ({
      page,
    }) => {
      const start = new Date("2026-01-01T00:00:00Z");
      await page.clock.install({ time: start });
      await openProbe(page);
      await page.clock.pauseAt(new Date(start.getTime() + 60_000));
      await page.evaluate(() =>
        (window as CacheProbeWindow).cacheRescueProbe.round(1),
      );
      await expect.poll(async () => (await state(page)).round).toBe(1);
      await page.evaluate(() =>
        (window as CacheProbeWindow).cacheRescueProbe.strategy(true),
      );
      await expect.poll(async () => (await state(page)).shared).toBe(true);
      await page.evaluate(
        (value) => (window as CacheProbeWindow).cacheRescueProbe.guess(value),
        phase === "playback" ? "1" : "0",
      );
      await expect
        .poll(async () => (await state(page)).prediction)
        .toBe(phase === "playback" ? "1" : "0");
      await page.evaluate(() =>
        (window as CacheProbeWindow).cacheRescueProbe.play(),
      );
      if (phase === "playback") {
        await expect.poll(async () => (await state(page)).playing).toBe(true);
        await page.clock.runFor(250);
        expect((await state(page)).time).toBeGreaterThan(0);
      } else {
        await expect
          .poll(async () => (await state(page)).predictionError)
          .toContain("whole number");
      }
      const before = await state(page);
      const previousCalls = await calls(page);
      let tick = 0;
      for (const value of [
        NaN,
        Infinity,
        -Infinity,
        -1,
        -0.5,
        0.5,
        1.5,
        2.5,
        ROUNDS.length,
        ROUNDS.length + 1,
        Number.MAX_SAFE_INTEGER,
      ]) {
        await page.evaluate(
          ({ action, value }) => {
            const probe = (window as CacheProbeWindow).cacheRescueProbe;
            probe[action](value);
            probe.rerender();
          },
          { action, value },
        );
        await expect(page.getByTestId("cache-state")).toHaveAttribute(
          "data-tick",
          String(++tick),
        );
        expect(
          await state(page),
          `${action}(${String(value)}) must not change the controller`,
        ).toEqual(before);
        expect(await calls(page)).toEqual(previousCalls);
      }
      for (const value of [ROUNDS.length - 1, 0]) {
        await page.evaluate(
          ({ action, value }) =>
            (window as CacheProbeWindow).cacheRescueProbe[action](value),
          { action, value },
        );
        await expect.poll(async () => (await state(page)).round).toBe(value);
        const reset = await state(page);
        expect(reset.shared).toBe(true);
        expect(reset.playing).toBe(false);
        expect(reset.time).toBe(-25);
        expect(reset.prediction).toBe("");
        expect(reset.predictionError).toBe("");
        expect(reset.run).toEqual(rescueRun(ROUNDS[value], true));
      }
    });
  }
}

test("reference calculation is reused across ordinary renders, strategy changes, reset and motion updates", async ({
  page,
}) => {
  await openProbe(page);
  const initial = await calls(page);
  expect(initial).toHaveLength(2); // Displayed unshared run plus independent reference.
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.guess("1"),
  );
  await expect.poll(async () => (await state(page)).prediction).toBe("1");
  // Force the hook body even when its visible snapshot is unchanged.
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.rerender(),
  );
  await expect(page.getByTestId("cache-state")).toHaveAttribute(
    "data-tick",
    "1",
  );
  expect(await calls(page)).toEqual(initial);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.strategy(true),
  );
  await expect.poll(async () => (await state(page)).shared).toBe(true);
  const changed = await calls(page);
  expect(changed).toEqual([...initial, { ...ROUNDS[0], coalesce: true }]);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.reset(),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => (await state(page)).reduced).toBe(true);
  expect(await calls(page)).toEqual(changed);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => (await state(page)).reduced).toBe(false);
  expect(await calls(page)).toEqual(changed);
});

test("challenge changes rebuild the reference while both strategies keep the same modeled results", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.strategy(true),
  );
  await expect.poll(async () => (await state(page)).shared).toBe(true);
  for (const round of [1, 2, 0]) {
    const previous = await calls(page);
    await page.evaluate(
      (round) => (window as CacheProbeWindow).cacheRescueProbe.round(round),
      round,
    );
    await expect.poll(async () => (await state(page)).round).toBe(round);
    const snapshot = await state(page);
    const expected = rescueRun(ROUNDS[round], true);
    expect(snapshot.run).toEqual(expected);
    expect(snapshot.counts).toEqual(rescueSnapshot(expected, snapshot.time));
    expect(snapshot.unsharedReads).toBe([24, 16, 1][round]);
    expect(await calls(page)).toEqual([
      ...previous,
      { ...ROUNDS[round], coalesce: true },
      { ...ROUNDS[round], coalesce: false },
    ]);
  }
  const previous = await calls(page);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.strategy(false),
  );
  await expect.poll(async () => (await state(page)).shared).toBe(false);
  expect((await state(page)).run).toEqual(rescueRun(ROUNDS[0], false));
  expect(await calls(page)).toEqual([
    ...previous,
    { ...ROUNDS[0], coalesce: false },
  ]);
});

test("playback ticks still update live counts without rebuilding the reference", async ({
  page,
}) => {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await openProbe(page);
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  const initial = await calls(page);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.play(),
  );
  await expect.poll(async () => (await state(page)).playing).toBe(true);
  await page.clock.runFor(250);
  const running = await state(page);
  expect(running.time).toBeGreaterThan(0);
  expect(running.finished).toBe(false);
  expect(running.counts).toEqual(
    rescueSnapshot(rescueRun(ROUNDS[0], false), running.time),
  );
  expect(await calls(page)).toEqual(initial);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.play(),
  );
  await expect.poll(async () => (await state(page)).playing).toBe(false);
  const paused = (await state(page)).time;
  await page.clock.runFor(250);
  expect((await state(page)).time).toBe(paused);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.play(),
  );
  await expect.poll(async () => (await state(page)).playing).toBe(true);
  await page.clock.runFor(3500);
  await expect.poll(async () => (await state(page)).finished).toBe(true);
  expect((await state(page)).counts).toEqual({
    queries: 24,
    waiting: 0,
    done: 24,
    hits: 0,
  });
  expect(await calls(page)).toEqual(initial);
  await page.evaluate(() =>
    (window as CacheProbeWindow).cacheRescueProbe.reset(),
  );
  await expect.poll(async () => (await state(page)).time).toBe(-25);
  expect((await state(page)).finished).toBe(false);
  expect(await calls(page)).toEqual(initial);
});
