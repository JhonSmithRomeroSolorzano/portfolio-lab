import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import type { DeferredProbeWindow } from "./fixtures/deferred-experiment-probe";
import {
  installLifecycleProbe,
  readLifecycleSnapshot,
} from "./helpers/lifecycle-probe";

const inputs = [
  "wheel",
  "touchstart",
  "pointerdown",
  "pointermove",
  "keydown",
] as const;
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
          new URL("./fixtures/deferred-experiment-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "deferred-experiment-probe",
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
  await page.addInitScript(installLifecycleProbe);
  await page.route("**/__deferred-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<main><button id="outside">Outside</button><article id="fixture-lab" tabindex="-1"><div id="probe-root"></div></article></main>',
    }),
  );
  await page.goto("/__deferred-probe#fixture-lab");
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByRole("status")).toContainText("Loading Fixture lab");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as DeferredProbeWindow).deferredProbe.metrics().requests,
      ),
    )
    .toBe(1);
}

async function inputCounts(page: Page) {
  const snapshot = await page.evaluate(readLifecycleSnapshot);
  return inputs.map((type) => snapshot.resources[`window:${type}:false`] ?? 0);
}

for (const type of inputs) {
  test(`${type} releases all landing-input listeners even while a download is pending`, async ({
    page,
  }) => {
    await openProbe(page);
    expect(await inputCounts(page)).toEqual([1, 1, 1, 1, 1]);
    await page.evaluate((type) => window.dispatchEvent(new Event(type)), type);
    await expect.poll(() => inputCounts(page)).toEqual([0, 0, 0, 0, 0]);
    await page.evaluate(() =>
      (window as DeferredProbeWindow).deferredProbe.resolve(),
    );
    await expect(page.getByTestId("loaded-lab")).toBeVisible();
    expect(await inputCounts(page)).toEqual([0, 0, 0, 0, 0]);
  });
}

test("successful landing retains interruption tracking until the first input", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() =>
    (window as DeferredProbeWindow).deferredProbe.resolve(),
  );
  await expect(page.getByTestId("loaded-lab")).toBeVisible();
  expect(await inputCounts(page)).toEqual([1, 1, 1, 1, 1]);
  await page.evaluate(() => window.dispatchEvent(new Event("pointermove")));
  await expect.poll(() => inputCounts(page)).toEqual([0, 0, 0, 0, 0]);
});

test("failed download releases landing listeners and retains the reload recovery action", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() =>
    (window as DeferredProbeWindow).deferredProbe.reject(),
  );
  await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
  await expect.poll(() => inputCounts(page)).toEqual([0, 0, 0, 0, 0]);
});

test("unmounting before download resolution releases listeners and never mounts late content", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() => {
    (window as DeferredProbeWindow).deferredProbe.unmount();
    document.getElementById("outside")!.focus();
    (window as DeferredProbeWindow).deferredProbe.resolve();
  });
  // Flush the promise resolution and the next rendering opportunity without a sleep.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  await expect(page.getByTestId("loaded-lab")).toHaveCount(0);
  await expect(page.locator("#outside")).toBeFocused();
  expect(await inputCounts(page)).toEqual([0, 0, 0, 0, 0]);
  expect(
    await page.evaluate(() =>
      (window as DeferredProbeWindow).deferredProbe.metrics(),
    ),
  ).toEqual({ requests: 1, mounts: 0, disposals: 0 });
});

for (const phase of ["render", "effect"] as const) {
  test(`${phase} failures clean established resources before repeated local remounts`, async ({
    page,
  }) => {
    await openProbe(page);
    await page.evaluate(() =>
      (window as DeferredProbeWindow).deferredProbe.resolve(),
    );
    for (let cycle = 0; cycle < 3; cycle++) {
      await expect(page.getByTestId("loaded-lab")).toBeVisible();
      await expect
        .poll(
          async () => (await page.evaluate(readLifecycleSnapshot)).intervals,
        )
        .toBe(1);
      await expect
        .poll(
          async () =>
            (await page.evaluate(readLifecycleSnapshot)).pendingFrames,
        )
        .toBe(1);
      await page.evaluate(
        (phase) => (window as DeferredProbeWindow).deferredProbe.crash(phase),
        phase,
      );
      await expect(page.getByRole("alert")).toContainText("ran into a problem");
      await expect
        .poll(async () => {
          const snapshot = await page.evaluate(readLifecycleSnapshot);
          return [
            snapshot.intervals,
            snapshot.pendingFrames,
            snapshot.resources["window:fixture-resource:false"] ?? 0,
            snapshot.resources["IntersectionObserver:targets"] ?? 0,
          ];
        })
        .toEqual([0, 0, 0, 0]);
      // The loader may still own one landing ResizeObserver; the failed child must not accumulate targets.
      await expect
        .poll(
          async () =>
            (await page.evaluate(readLifecycleSnapshot)).resources[
              "ResizeObserver:targets"
            ] ?? 0,
        )
        .toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() =>
          (window as DeferredProbeWindow).deferredProbe.metrics(),
        ),
      ).toEqual({ requests: 1, mounts: cycle + 1, disposals: cycle + 1 });
      await page
        .getByRole("button", { name: "Try Fixture lab again" })
        .press("Enter");
      await expect(page.locator("#fixture-lab")).toBeFocused();
    }
  });
}
