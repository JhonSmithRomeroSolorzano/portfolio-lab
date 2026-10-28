import assert from "node:assert/strict";
import test from "node:test";
import { observeCanvas } from "../src/shared/canvas/observe-canvas";

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
