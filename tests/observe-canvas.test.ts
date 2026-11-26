import assert from "node:assert/strict";
import test from "node:test";
import {
  observeCanvas,
  observeCanvasEnvironment,
} from "../src/shared/canvas/observe-canvas";

test("canvas observers coalesce changes, skip identical state, retain DPR and cancel disposal", () => {
  for (const [hasResizeObserver, maxRatio] of [
    [true, 2],
    [false, 2],
    [true, 1.5],
  ] as const) {
    let width = 320,
      height = 240,
      writes = 0,
      transforms = 0,
      draws = 0,
      nextFrame = 0;
    const frames = new Map<number, FrameRequestCallback>(),
      observers: (() => void)[] = [],
      listeners = new Map<string, () => void>();
    const win = {
      devicePixelRatio: 3,
      addEventListener: (name: string, callback: () => void) =>
        listeners.set(name, callback),
      removeEventListener: (name: string) => listeners.delete(name),
    };
    const root = { dataset: { theme: "light" } };
    let disconnects = 0;
    class Observer {
      constructor(callback: () => void) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {
        disconnects++;
      }
    }
    let backingWidth = 0,
      backingHeight = 0;
    const canvas = {
      getBoundingClientRect: () => ({ width, height }),
      get width() {
        return backingWidth;
      },
      set width(value: number) {
        backingWidth = value;
        writes++;
      },
      get height() {
        return backingHeight;
      },
      set height(value: number) {
        backingHeight = value;
        writes++;
      },
    } as HTMLCanvasElement;
    const globals = {
      window: win,
      document: { documentElement: root },
      ResizeObserver: hasResizeObserver ? Observer : undefined,
      MutationObserver: Observer,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      },
      cancelAnimationFrame: (id: number) => frames.delete(id),
    };
    const previous = Object.fromEntries(
      Object.keys(globals).map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    try {
      for (const [key, value] of Object.entries(globals))
        Object.defineProperty(globalThis, key, { value, configurable: true });
      const flush = () => {
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(0);
      };
      const notify = () => {
        listeners.get("resize")?.();
        observers.forEach((callback) => callback());
      };
      const dispose = observeCanvas(
        canvas,
        {
          setTransform: () => {
            transforms++;
          },
        } as unknown as CanvasRenderingContext2D,
        (w, h) => {
          assert.equal(w, width);
          assert.equal(h, height);
          draws++;
        },
        maxRatio,
      );
      assert.equal(draws, 1);
      assert.equal(canvas.width, 320 * maxRatio);
      assert.equal(canvas.height, 240 * maxRatio);
      notify();
      notify();
      assert.equal(frames.size, 1);
      flush();
      assert.equal(draws, 1);
      assert.equal(writes, 2);
      width = 400;
      height = 250;
      root.dataset.theme = "dark";
      notify();
      notify();
      flush();
      assert.equal(draws, 2);
      assert.equal(canvas.width, 400 * maxRatio);
      assert.equal(canvas.height, 250 * maxRatio);
      root.dataset.theme = "light";
      notify();
      flush();
      assert.equal(draws, 3);
      assert.equal(writes, 4);
      win.devicePixelRatio = 1;
      notify();
      flush();
      assert.equal(canvas.width, 400);
      assert.equal(transforms, 3);
      width = 450;
      notify();
      assert.equal(frames.size, 1);
      dispose();
      notify();
      flush();
      assert.equal(draws, 4);
      assert.equal(frames.size, 0);
      assert.equal(listeners.size, 0);
      assert.equal(disconnects, hasResizeObserver ? 2 : 1);
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  }
});

for (const resize of [true, false])
  for (const failure of ["observation", "measurement", "paint"] as const)
    test(`canvas setup releases resources after ${failure} fails, ResizeObserver=${resize}`, (t) => {
      const expected = new Error(`Failed ${failure}`);
      const targets = new Set<object>();
      const callbacks: (() => void)[] = [];
      const listeners = new Set<() => void>();
      const frames = new Map<number, FrameRequestCallback>();
      let frame = 0;
      class Observer {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe(target: object) {
          if (target === root && failure === "observation") throw expected;
          targets.add(this);
        }
        disconnect() {
          targets.delete(this);
        }
      }
      const root = { dataset: { theme: "light" } };
      const globals = {
        document: { documentElement: root },
        window: {
          devicePixelRatio: 1,
          addEventListener: (_: string, callback: () => void) =>
            listeners.add(callback),
          removeEventListener: (_: string, callback: () => void) =>
            listeners.delete(callback),
        },
        ResizeObserver: resize ? Observer : undefined,
        MutationObserver: Observer,
        requestAnimationFrame: (callback: FrameRequestCallback) => {
          frames.set(++frame, callback);
          return frame;
        },
        cancelAnimationFrame: (id: number) => frames.delete(id),
      };
      for (const [key, value] of Object.entries(globals)) {
        const previous = Object.getOwnPropertyDescriptor(globalThis, key);
        Object.defineProperty(globalThis, key, { value, configurable: true });
        t.after(() => {
          if (previous) Object.defineProperty(globalThis, key, previous);
          else Reflect.deleteProperty(globalThis, key);
        });
      }
      let paints = 0;
      assert.throws(
        () =>
          observeCanvasEnvironment(
            {
              getBoundingClientRect() {
                if (failure === "measurement") throw expected;
                return { width: 320, height: 240 };
              },
            } as HTMLElement,
            () => {
              paints++;
              // A synchronous invalidation during setup must be canceled too.
              for (const callback of callbacks) callback();
              throw expected;
            },
          ),
        (error) => error === expected,
      );
      assert.equal(targets.size, 0, "failed setup retains no observer targets");
      assert.equal(
        listeners.size,
        0,
        "failed setup retains no resize listener",
      );
      assert.equal(frames.size, 0, "failed setup cancels queued redraws");
      for (const callback of callbacks) callback();
      assert.equal(
        frames.size,
        0,
        "late deliveries cannot restart observation",
      );
      assert.equal(paints, failure === "paint" ? 1 : 0);
    });
