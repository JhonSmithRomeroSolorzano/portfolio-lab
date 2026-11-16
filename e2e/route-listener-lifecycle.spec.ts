import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import {
  freshProgress,
  ROUTE_PROGRESS_KEY,
} from "../src/features/playground/connection-puzzle/route-progress";
import {
  createRouteVisit,
  routeTransition,
} from "../src/features/playground/connection-puzzle/route-transitions";
import type {
  RouteProbeState,
  RouteProbeWindow,
} from "./fixtures/route-progress-probe";

type ListenerMetrics = { adds: number; removes: number; active: number };
type HarnessWindow = RouteProbeWindow & {
  routeLifecycle: {
    metrics(): {
      storage: ListenerMetrics;
      focus: ListenerMetrics;
      reads: number;
      writes: number;
    };
    denyReads(value: boolean): void;
    denyWrites(value: boolean): void;
    afterWrite(mode: "none" | "corrupt" | "deny"): void;
    externalRaw(raw: string | null): void;
    raw(): string | null;
  };
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
          new URL("./fixtures/route-progress-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "route-progress-probe",
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
  await page.addInitScript((key) => {
    const listeners = {
      storage: {
        adds: 0,
        removes: 0,
        callbacks: new Set<EventListenerOrEventListenerObject>(),
      },
      focus: {
        adds: 0,
        removes: 0,
        callbacks: new Set<EventListenerOrEventListenerObject>(),
      },
    };
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (
      type,
      callback,
      options,
    ) {
      if (
        this === window &&
        (type === "storage" || type === "focus") &&
        callback
      ) {
        listeners[type].adds++;
        listeners[type].callbacks.add(callback);
      }
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      callback,
      options,
    ) {
      if (
        this === window &&
        (type === "storage" || type === "focus") &&
        callback
      ) {
        listeners[type].removes++;
        listeners[type].callbacks.delete(callback);
      }
      return remove.call(this, type, callback, options);
    };
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    const drop = Storage.prototype.removeItem;
    let reads = 0,
      writes = 0,
      denyReads = false,
      denyWrites = false;
    let afterWrite: "none" | "corrupt" | "deny" = "none";
    Storage.prototype.getItem = function (name) {
      if (this === localStorage && name === key) {
        reads++;
        if (denyReads) throw new DOMException("Read denied", "SecurityError");
      }
      return get.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (this !== localStorage || name !== key)
        return set.call(this, name, value);
      writes++;
      if (denyWrites)
        throw new DOMException("Quota denied", "QuotaExceededError");
      set.call(this, name, value);
      if (afterWrite === "corrupt") set.call(this, key, "{bad");
      if (afterWrite === "deny") denyReads = true;
    };
    (window as HarnessWindow).routeLifecycle = {
      metrics: () => {
        const metrics = (item: typeof listeners.storage) => ({
          adds: item.adds,
          removes: item.removes,
          active: item.callbacks.size,
        });
        return {
          storage: metrics(listeners.storage),
          focus: metrics(listeners.focus),
          reads,
          writes,
        };
      },
      denyReads: (value) => {
        denyReads = value;
      },
      denyWrites: (value) => {
        denyWrites = value;
      },
      afterWrite: (mode) => {
        afterWrite = mode;
      },
      externalRaw(raw) {
        if (raw === null) drop.call(localStorage, key);
        else set.call(localStorage, key, raw);
      },
      raw: () => get.call(localStorage, key),
    };
  }, ROUTE_PROGRESS_KEY);
  await page.route("**/__route-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="route-probe"></div>',
    }),
  );
  await page.goto("/__route-probe");
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByTestId("route-state")).toBeVisible();
  await expect.poll(async () => (await metrics(page)).storage.active).toBe(1);
}
async function state(page: Page): Promise<RouteProbeState> {
  return JSON.parse((await page.getByTestId("route-state").textContent())!);
}
const metrics = (page: Page) =>
  page.evaluate(() => (window as HarnessWindow).routeLifecycle.metrics());
async function expectListeners(page: Page, adds = 1, removes = 0, active = 1) {
  const snapshot = await metrics(page);
  const expected = { adds, removes, active };
  expect(snapshot.storage).toEqual(expected);
  expect(snapshot.focus).toEqual(expected);
}
const focus = (page: Page) =>
  page.evaluate(() => window.dispatchEvent(new Event("focus")));
async function externalRaw(page: Page, raw: string | null) {
  await page.evaluate(
    (value) => (window as HarnessWindow).routeLifecycle.externalRaw(value),
    raw,
  );
}
function externalProgress(moves: number) {
  let visit = createRouteVisit({ progress: freshProgress(), status: "new" });
  for (let move = 0; move < moves; move++)
    visit = routeTransition(visit, { type: "turn", index: 0 })!;
  return JSON.stringify(visit.saved.progress);
}

test("progress changes reuse listeners; unmount releases them and remount owns one pair", async ({
  page,
}) => {
  await openProbe(page);
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.turn(0),
  );
  await expect
    .poll(async () => (await state(page)).progress.boards[0].moves)
    .toBe(1);
  expect((await state(page)).canUndo).toBe(true);
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.hint(),
  );
  await expect
    .poll(async () => (await state(page)).progress.boards[0].assisted)
    .toBe(true);
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.undo(),
  );
  await expect.poll(async () => (await state(page)).canUndo).toBe(false);
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.select(1),
  );
  await expect.poll(async () => (await state(page)).progress.level).toBe(1);
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.reset(),
  );
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.rerender(),
  );
  await expect(page.getByTestId("route-state")).toHaveAttribute(
    "data-tick",
    "1",
  );
  await expectListeners(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.unmount(),
  );
  await expect(page.getByTestId("route-state")).toHaveCount(0);
  await expectListeners(page, 1, 1, 0);
  const before = await metrics(page);
  await focus(page);
  await page.evaluate(
    (key) =>
      window.dispatchEvent(
        new StorageEvent("storage", { key, storageArea: localStorage }),
      ),
    ROUTE_PROGRESS_KEY,
  );
  expect(await metrics(page)).toEqual(before);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.mount(),
  );
  await expect(page.getByTestId("route-state")).toBeVisible();
  await expect.poll(async () => (await metrics(page)).storage.active).toBe(1);
  await expectListeners(page, 2, 1, 1);
});

for (const mode of ["corrupt", "deny"] as const) {
  test(`post-progress refresh still detects a ${mode} read after a successful write and recovers on focus`, async ({
    page,
  }) => {
    await openProbe(page);
    await page.evaluate(
      (mode) => (window as HarnessWindow).routeLifecycle.afterWrite(mode),
      mode,
    );
    await page.evaluate(() =>
      (window as HarnessWindow).routeProgressProbe.turn(0),
    );
    await expect
      .poll(async () => (await state(page)).status)
      .toBe(mode === "corrupt" ? "invalid" : "unavailable");
    expect((await state(page)).progress.boards[0].moves).toBe(1);
    await expectListeners(page);
    const saved = JSON.stringify((await state(page)).progress);
    await page.evaluate(() => {
      (window as HarnessWindow).routeLifecycle.afterWrite("none");
      (window as HarnessWindow).routeLifecycle.denyReads(false);
    });
    await externalRaw(page, saved);
    await focus(page);
    await expect.poll(async () => (await state(page)).status).toBe("saved");
    expect((await state(page)).progress.boards[0].moves).toBe(1);
    await expectListeners(page);
  });
}

test("quota failures preserve local play and a later accepted write restores persistence", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeLifecycle.denyWrites(true),
  );
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.turn(0),
  );
  await expect.poll(async () => (await state(page)).status).toBe("unavailable");
  expect((await state(page)).progress.boards[0].moves).toBe(1);
  await focus(page);
  expect((await state(page)).status).toBe("unavailable");
  expect((await state(page)).progress.boards[0].moves).toBe(1);
  await page.evaluate(() =>
    (window as HarnessWindow).routeLifecycle.denyWrites(false),
  );
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.turn(1),
  );
  await expect.poll(async () => (await state(page)).status).toBe("saved");
  expect((await state(page)).progress.boards[0].moves).toBe(2);
  const raw = await page.evaluate(() =>
    (window as HarnessWindow).routeLifecycle.raw(),
  );
  expect(JSON.parse(raw!).boards[0].moves).toBe(2);
  await expectListeners(page);
});

test("storage events and pre-action conflicts still reconcile without replacing listeners", async ({
  page,
}) => {
  await openProbe(page);
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.turn(0),
  );
  await expect.poll(async () => (await state(page)).canUndo).toBe(true);
  await externalRaw(page, externalProgress(2));
  const before = await metrics(page);
  await page.evaluate((key) => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "unrelated",
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key, storageArea: sessionStorage }),
    );
  }, ROUTE_PROGRESS_KEY);
  expect((await metrics(page)).reads).toBe(before.reads);
  await page.evaluate(
    (key) =>
      window.dispatchEvent(
        new StorageEvent("storage", { key, storageArea: localStorage }),
      ),
    ROUTE_PROGRESS_KEY,
  );
  await expect
    .poll(async () => (await state(page)).progress.boards[0].moves)
    .toBe(2);
  expect((await state(page)).canUndo).toBe(false);
  expect((await state(page)).notice).toContain("another tab");
  await expectListeners(page);
  await externalRaw(page, externalProgress(3));
  const writes = (await metrics(page)).writes;
  await page.evaluate(() =>
    (window as HarnessWindow).routeProgressProbe.turn(1),
  );
  await expect
    .poll(async () => (await state(page)).progress.boards[0].moves)
    .toBe(3);
  expect((await state(page)).notice).toContain("try your action again");
  expect((await metrics(page)).writes).toBe(writes);
  await expectListeners(page);
  await externalRaw(page, null);
  await page.evaluate(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: null, storageArea: localStorage }),
    ),
  );
  await expect
    .poll(async () => (await state(page)).progress.boards[0].moves)
    .toBe(0);
  expect((await state(page)).notice).toContain("cleared in another tab");
  await expectListeners(page);
});
