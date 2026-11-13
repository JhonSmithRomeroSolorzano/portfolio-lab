import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {
  installLifecycleProbe,
  readLifecycleSnapshot,
} from "./helpers/lifecycle-probe";

type ProbeWindow = typeof window & {
  interruptionObserver: { targets(): number; emit(visible: boolean[]): void };
};
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
          new URL("./fixtures/playback-interruption-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "playback-interruption-probe",
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
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const subscriptions = new Map<
      IntersectionObserver,
      {
        callback: IntersectionObserverCallback;
        targets: Set<Element>;
      }
    >();
    window.IntersectionObserver = class implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly scrollMargin = "0px";
      readonly thresholds = [0];
      constructor(callback: IntersectionObserverCallback) {
        subscriptions.set(this, { callback, targets: new Set() });
      }
      observe(target: Element) {
        subscriptions.get(this)!.targets.add(target);
      }
      unobserve(target: Element) {
        subscriptions.get(this)?.targets.delete(target);
      }
      disconnect() {
        subscriptions.delete(this);
      }
      takeRecords() {
        return [];
      }
    };
    (window as ProbeWindow).interruptionObserver = {
      targets: () =>
        [...subscriptions.values()].reduce(
          (sum, item) => sum + item.targets.size,
          0,
        ),
      emit(visible) {
        for (const [observer, { callback, targets }] of subscriptions) {
          for (const target of targets) {
            const box = target.getBoundingClientRect();
            const time = performance.now();
            const entries = visible.map(
              (isIntersecting, index): IntersectionObserverEntry => ({
                target,
                time: time + index,
                isIntersecting,
                intersectionRatio: isIntersecting ? 1 : 0,
                boundingClientRect: box,
                intersectionRect: box,
                rootBounds: box,
              }),
            );
            callback(entries, observer);
          }
        }
      },
    };
  });
  await page.route("**/__playback-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="playback-probe"></div>',
    }),
  );
  await page.goto("/__playback-probe#playback-probe");
  await page.addScriptTag({ type: "module", content: fixture });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as ProbeWindow).interruptionObserver.targets(),
      ),
    )
    .toBe(1);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByTestId("playback-state")).toHaveAttribute(
    "data-playing",
    "true",
  );
}

async function emit(page: Page, visible: boolean[]) {
  await page.evaluate(
    (batch) => (window as ProbeWindow).interruptionObserver.emit(batch),
    visible,
  );
}

test("a latest visible entry preserves playback despite earlier offscreen entries", async ({
  page,
}) => {
  await openProbe(page);
  const state = page.getByTestId("playback-state");
  for (const batch of [
    [false, true],
    [false, false, true],
    [true, false, true],
    [],
    [true],
  ]) {
    await emit(page, batch);
    await expect(state).toHaveAttribute("data-playing", "true");
    await expect(state).toHaveAttribute("data-stops", "0");
  }
});

test("a latest offscreen entry stops once and re-entry does not restart explicit playback", async ({
  page,
}) => {
  await openProbe(page);
  const state = page.getByTestId("playback-state");
  let stops = 0;
  for (const batch of [[true, false], [false, true, false], [false]]) {
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(state).toHaveAttribute("data-playing", "true");
    await emit(page, batch);
    await expect(state).toHaveAttribute("data-playing", "false");
    await expect(state).toHaveAttribute("data-stops", String(++stops));
    await emit(page, [true]);
    await expect(state).toHaveAttribute("data-playing", "false");
    await expect(state).toHaveAttribute("data-stops", String(stops));
  }
});

for (const exit of ["scroll", "resize"] as const) {
  test(`explicit playback stops on ${exit} without IntersectionObserver and releases its fallback`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: undefined,
      });
    });
    await page.addInitScript(installLifecycleProbe);
    await page.route("**/__playback-probe", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<style>
          body { margin: 0; height: 2400px; }
          #playback-target { position: ${exit === "resize" ? "fixed" : "absolute"}; top: 300px; left: 16px; }
          #unmount-probe { position: fixed; top: 0; right: 0; }
        </style>
        <button id="unmount-probe">Unmount</button>
        <div id="playback-probe"></div>`,
      }),
    );
    await page.goto("/__playback-probe#playback-probe");
    const listeners = async () => {
      const { resources } = await page.evaluate(readLifecycleSnapshot);
      return [
        resources["window:scroll:false"] ?? 0,
        resources["window:resize:false"] ?? 0,
      ];
    };
    const before = await listeners();
    await page.addScriptTag({ type: "module", content: fixture });
    const state = page.getByTestId("playback-state");
    const target = page.locator("#playback-target");
    const start = page.getByRole("button", { name: "Start", exact: true });
    await start.click();
    await expect(state).toHaveAttribute("data-playing", "true");
    if (exit === "scroll") await page.mouse.wheel(0, 800);
    else await page.setViewportSize({ width: 1280, height: 200 });
    await expect(target).not.toBeInViewport();
    await expect(state).toHaveAttribute("data-playing", "false");
    if (exit === "scroll") await page.mouse.wheel(0, -800);
    else await page.setViewportSize({ width: 1280, height: 800 });
    await expect(target).toBeInViewport();
    await expect(state).toHaveAttribute("data-playing", "false");
    await start.click();
    await expect(state).toHaveAttribute("data-playing", "true");
    await expect.poll(listeners).toEqual(before.map((count) => count + 1));
    await page.getByRole("button", { name: "Unmount", exact: true }).click();
    await expect(state).toHaveCount(0);
    await expect.poll(listeners).toEqual(before);
  });
}
