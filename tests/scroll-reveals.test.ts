import { test } from "node:test";
import assert from "node:assert/strict";
import { observeScrollReveals } from "../src/scroll-reveals.ts";

function fixture(reduced = false) {
  let enter: (entries: unknown[]) => void;
  let systemChange: () => void = () => {};
  let focus: (event: unknown) => void = () => {};
  const observed = new Set<unknown>();
  let calls = 0;
  let cancelled = 0;
  let focused = false;
  const target = {
    dataset: { reveal: "80" },
    matches: () => focused,
    contains: (node: unknown) => node === target,
    animate: () => {
      calls++;
      return {
        cancel: () => {
          cancelled++;
        },
        finished: new Promise(() => {}),
      };
    },
  };
  const root = {
    querySelectorAll: () => [target],
    addEventListener: (_: string, callback: typeof focus) => {
      focus = callback;
    },
    removeEventListener: () => {
      focus = () => {};
    },
  };
  const motion = {
    matches: reduced,
    addEventListener: (_: string, callback: () => void) => {
      systemChange = callback;
    },
    removeEventListener: () => {
      systemChange = () => {};
    },
  };
  class FakeObserver {
    constructor(callback: typeof enter) {
      enter = callback;
    }
    observe(element: unknown) {
      observed.add(element);
    }
    unobserve(element: unknown) {
      observed.delete(element);
    }
    disconnect() {
      observed.clear();
    }
  }
  const cleanup = observeScrollReveals(
    root as unknown as HTMLElement,
    motion as unknown as MediaQueryList,
    FakeObserver as unknown as typeof IntersectionObserver,
  );
  return {
    enter: (visible: boolean) => enter([{ target, isIntersecting: visible }]),
    reduce: (value: boolean) => {
      motion.matches = value;
      systemChange();
    },
    focus: () => {
      focused = true;
      focus({ target });
    },
    cleanup,
    stats: () => ({ calls, cancelled, observed: observed.size }),
  };
}

test("reveals enter once, ignore offscreen reports, and release their observer", () => {
  const view = fixture();
  view.enter(false);
  assert.deepEqual(view.stats(), { calls: 0, cancelled: 0, observed: 1 });
  view.enter(true);
  view.enter(true);
  assert.deepEqual(view.stats(), { calls: 1, cancelled: 0, observed: 0 });
  view.cleanup();
  assert.equal(view.stats().cancelled, 1);
});

test("reduced motion prevents entrances and cancels animations when changed live", () => {
  const view = fixture(true);
  assert.equal(view.stats().observed, 0);
  view.reduce(false);
  view.enter(true);
  view.reduce(true);
  assert.deepEqual(view.stats(), { calls: 1, cancelled: 1, observed: 0 });
  view.cleanup();
  view.reduce(false);
  assert.equal(view.stats().observed, 0);
});

test("keyboard focus cancels motion and focused content never starts an entrance", () => {
  const first = fixture();
  first.enter(true);
  first.focus();
  assert.equal(first.stats().cancelled, 1);
  first.cleanup();
  const second = fixture();
  second.focus();
  second.enter(true);
  assert.equal(second.stats().calls, 0);
  second.cleanup();
});
