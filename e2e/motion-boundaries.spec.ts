import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {
  CURVES,
  MOTION_DURATION,
} from "../src/features/playground/motion-studio/curves";
import type {
  MotionProbeState,
  MotionProbeWindow,
} from "./fixtures/motion-playback-probe";

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
          new URL("./fixtures/motion-playback-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "motion-playback-probe",
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

async function openProbe(
  page: Page,
  reducedMotion: "reduce" | "no-preference" = "no-preference",
) {
  await page.emulateMedia({ reducedMotion });
  await page.route("**/__motion-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="motion-probe"></div>',
    }),
  );
  await page.goto("/__motion-probe#motion-studio");
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByTestId("motion-state")).toBeVisible();
  await expect
    .poll(async () => (await state(page)).reduced)
    .toBe(reducedMotion === "reduce");
}
async function state(page: Page): Promise<MotionProbeState> {
  return JSON.parse((await page.getByTestId("motion-state").textContent())!);
}
const animations = (page: Page) =>
  page.evaluate(() =>
    (window as MotionProbeWindow).motionPlaybackProbe.animations(),
  );
async function play(page: Page) {
  await page.evaluate(() =>
    (window as MotionProbeWindow).motionPlaybackProbe.play(),
  );
}
async function choose(page: Page, action: "curve" | "duration", value: number) {
  await page.evaluate(
    ({ action, value }) =>
      (window as MotionProbeWindow).motionPlaybackProbe[action](value),
    { action, value },
  );
}
function invalidValues(action: "curve" | "duration") {
  return action === "curve"
    ? [
        NaN,
        Infinity,
        -Infinity,
        -1,
        -0.5,
        0.5,
        CURVES.length - 0.5,
        CURVES.length,
        Number.MAX_SAFE_INTEGER,
      ]
    : [
        NaN,
        Infinity,
        -Infinity,
        -1,
        0,
        MOTION_DURATION.min - 1,
        MOTION_DURATION.min + 0.5,
        MOTION_DURATION.min + MOTION_DURATION.step / 2,
        MOTION_DURATION.max - 1,
        MOTION_DURATION.max + 1,
        Number.MAX_SAFE_INTEGER,
      ];
}

for (const action of ["curve", "duration"] as const) {
  test(`invalid ${action} actions and same-setting actions preserve native playback`, async ({
    page,
  }) => {
    await openProbe(page);
    await play(page);
    await expect.poll(async () => (await state(page)).playing).toBe(true);
    const before = await state(page);
    const original = await animations(page);
    expect(original.handles).toHaveLength(2);
    expect(original.handles.map((handle) => handle.playState)).toEqual([
      "paused",
      "paused",
    ]);
    let tick = 0;
    for (const value of [before[action], ...invalidValues(action)]) {
      await choose(page, action, value);
      await page.evaluate(() =>
        (window as MotionProbeWindow).motionPlaybackProbe.rerender(),
      );
      await expect(page.getByTestId("motion-state")).toHaveAttribute(
        "data-tick",
        String(++tick),
      );
      expect(
        await state(page),
        `${action}(${String(value)}) must preserve playback`,
      ).toEqual(before);
      expect(await animations(page)).toEqual(original);
    }
    const valid =
      action === "curve"
        ? [0, CURVES.length - 1]
        : Array.from(
            {
              length:
                (MOTION_DURATION.max - MOTION_DURATION.min) /
                  MOTION_DURATION.step +
                1,
            },
            (_, i) => MOTION_DURATION.min + i * MOTION_DURATION.step,
          );
    for (const value of valid) {
      await choose(page, action, value);
      await expect.poll(async () => (await state(page))[action]).toBe(value);
      expect((await state(page)).playing).toBe(false);
      expect((await state(page)).arrived).toBe(false);
      expect(
        (await animations(page)).handles.map((handle) => handle.playState),
      ).toEqual(["idle", "idle"]);
      await play(page);
      await expect.poll(async () => (await state(page)).playing).toBe(true);
      const current = await state(page);
      const pair = (await animations(page)).handles;
      expect(pair.map((handle) => handle.duration)).toEqual([
        current.duration,
        current.duration,
      ]);
      const easing = await page.evaluate(
        (value) =>
          new KeyframeEffect(null, [], { easing: value }).getTiming().easing,
        CURVES[current.curve].easing,
      );
      expect(pair.map((handle) => handle.easing)).toEqual([easing, "linear"]);
    }
    await page.evaluate(() =>
      (window as MotionProbeWindow).motionPlaybackProbe.unmount(),
    );
    await expect(page.getByTestId("motion-state")).toHaveCount(0);
    expect(
      (await animations(page)).handles.map((handle) => handle.playState),
    ).toEqual(["idle", "idle"]);
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`invalid actions preserve completion in ${reducedMotion} and valid changes restore readiness`, async ({
    page,
  }) => {
    await openProbe(page, reducedMotion);
    await play(page);
    if (reducedMotion === "no-preference")
      await page.evaluate(() =>
        (window as MotionProbeWindow).motionPlaybackProbe.finish(),
      );
    await expect.poll(async () => (await state(page)).arrived).toBe(true);
    expect((await state(page)).playing).toBe(false);
    const before = await state(page);
    const original = await animations(page);
    expect(original.created).toBe(reducedMotion === "reduce" ? 0 : 2);
    let tick = 0;
    for (const action of ["curve", "duration"] as const) {
      for (const value of invalidValues(action)) {
        await choose(page, action, value);
        await page.evaluate(() =>
          (window as MotionProbeWindow).motionPlaybackProbe.rerender(),
        );
        await expect(page.getByTestId("motion-state")).toHaveAttribute(
          "data-tick",
          String(++tick),
        );
        expect(await state(page)).toEqual(before);
        expect(await animations(page)).toEqual(original);
      }
    }
    await choose(page, "curve", 0);
    await expect.poll(async () => (await state(page)).curve).toBe(0);
    expect((await state(page)).arrived).toBe(false);
    await play(page);
    if (reducedMotion === "no-preference")
      await page.evaluate(() =>
        (window as MotionProbeWindow).motionPlaybackProbe.finish(),
      );
    await expect.poll(async () => (await state(page)).arrived).toBe(true);
    await choose(page, "duration", MOTION_DURATION.min);
    await expect
      .poll(async () => (await state(page)).duration)
      .toBe(MOTION_DURATION.min);
    expect((await state(page)).arrived).toBe(false);
  });
}

test("production duration control uses the controller's shared limits and step", async ({
  page,
}) => {
  await page.goto("/#motion-studio");
  const slider = page.getByRole("slider", { name: /Duration/ });
  await expect(slider).toHaveAttribute("min", String(MOTION_DURATION.min));
  await expect(slider).toHaveAttribute("max", String(MOTION_DURATION.max));
  await expect(slider).toHaveAttribute("step", String(MOTION_DURATION.step));
  await expect(slider).toHaveValue(String(MOTION_DURATION.initial));
});
