import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPlainNavigation,
  observePortfolioMotion,
  readingSection,
} from "../src/app/portfolio-motion.ts";

const plainClick = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
};

function fixture(reduced = false, starts = [0, 1000, 2000]) {
  type Listener = (event?: unknown) => void;
  function events() {
    const listeners = new Map<string, Listener>();
    return {
      listeners,
      addEventListener: (name: string, listener: Listener) =>
        listeners.set(name, listener),
      removeEventListener: (name: string) => listeners.delete(name),
      emit: (name: string, event?: unknown) => listeners.get(name)?.(event),
    };
  }
  function styled() {
    const values = new Map<string, string>();
    return {
      values,
      dataset: {} as Record<string, string>,
      style: {
        setProperty: (key: string, value: string) => values.set(key, value),
      },
    };
  }
  const frames = new Map<number, () => void>();
  const timers = new Map<number, () => void>();
  let counter = 0;
  const motion = { ...events(), matches: reduced };
  const view = {
    ...events(),
    innerHeight: 800,
    scrollY: 0,
    location: { hash: "" },
    matchMedia: () => motion,
    requestAnimationFrame: (fn: () => void) => {
      const id = ++counter;
      frames.set(id, fn);
      return id;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    setTimeout: (fn: () => void) => {
      const id = ++counter;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id: number) => timers.delete(id),
  };
  const pulses: Array<{ id: string; cancelled: boolean }> = [];
  const sections = ["workbench", "resume", "contact"].map((id, index) => ({
    id,
    getBoundingClientRect: () => ({
      top: starts[index] - view.scrollY,
      bottom: starts[index] + 1000 - view.scrollY,
      height: 1000,
    }),
    querySelector: () => ({
      animate: () => {
        const pulse = { id, cancelled: false };
        pulses.push(pulse);
        return {
          cancel: () => {
            pulse.cancelled = true;
          },
          finished: new Promise(() => {}),
        };
      },
    }),
  }));
  // Menu order deliberately differs from the page's order.
  const links = ["contact", "workbench", "resume"].map((id, index) => {
    const attributes = new Map<string, string>();
    const link = {
      hash: `#${id}`,
      attributes,
      offsetLeft: 0,
      offsetTop: index * 44,
      offsetWidth: 150,
      offsetHeight: 40,
      setAttribute: (key: string, value: string) => attributes.set(key, value),
      removeAttribute: (key: string) => attributes.delete(key),
      closest: () => link,
    };
    return link;
  });
  const nav = { ...events(), ...styled(), querySelectorAll: () => links };
  const frame = styled();
  const row = {
    ...styled(),
    getBoundingClientRect: () => ({ top: 1100 - view.scrollY, height: 500 }),
  };
  const root = {
    ownerDocument: { documentElement: { scrollHeight: 2400 } },
    querySelectorAll: (selector: string) =>
      selector.startsWith(":scope") ? sections : [row],
    closest: () => frame,
  };
  const cleanup = observePortfolioMotion(
    root as unknown as HTMLElement,
    nav as unknown as HTMLElement,
    view as unknown as Window,
  );
  const flush = (queue: Map<number, () => void>) => {
    const callbacks = [...queue.values()];
    queue.clear();
    callbacks.forEach((fn) => fn());
  };
  return {
    cleanup,
    pulses,
    frame,
    row,
    frames,
    timers,
    nav,
    view,
    motion,
    active: () =>
      links
        .filter((link) => link.attributes.has("aria-current"))
        .map((link) => link.hash),
    click: (id: string, overrides = {}) =>
      nav.emit("click", {
        ...plainClick,
        ...overrides,
        target: links.find((link) => link.hash === `#${id}`),
        preventDefault: () =>
          assert.fail("Native navigation must not be intercepted"),
      }),
    scroll: (y: number) => {
      view.scrollY = y;
      view.emit("scroll");
    },
    flush: () => flush(frames),
    settle: () => {
      flush(timers);
      flush(frames);
    },
    reduce: (value: boolean) => {
      motion.matches = value;
      motion.emit("change");
    },
  };
}

test("section tracking handles gaps, document order, and short final sections", () => {
  const sections = [
    { id: "first", top: -600 },
    { id: "second", top: 180 },
    { id: "last", top: 600 },
  ];
  assert.equal(readingSection(sections, 800, false), "second");
  assert.equal(readingSection(sections, 400, false), "first");
  assert.equal(readingSection(sections, 800, true), "last");
  assert.equal(readingSection([], 800, false), undefined);
});

test("modified clicks keep their normal browser behavior", () => {
  assert.equal(isPlainNavigation(plainClick), true);
  for (const change of [
    { button: 1 },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { defaultPrevented: true },
  ]) {
    assert.equal(isPlainNavigation({ ...plainClick, ...change }), false);
  }
  const page = fixture();
  page.click("resume", { ctrlKey: true });
  assert.equal(page.timers.size, 0);
  assert.deepEqual(page.active(), ["#workbench"]);
  page.cleanup();
});

test("scroll updates coalesce and keep progress and timeline values bounded", () => {
  const page = fixture();
  for (let i = 0; i < 20; i++) page.scroll(1000);
  assert.equal(page.frames.size, 1);
  page.flush();
  assert.deepEqual(page.active(), ["#resume"]);
  assert.equal(page.nav.values.get("--nav-y"), "88px");
  assert.equal(page.frame.values.get("--reading-progress"), "0.625");
  assert.equal(page.row.dataset.traced, "true");
  page.scroll(3000);
  page.flush();
  assert.equal(page.frame.values.get("--reading-progress"), "1");
  assert.equal(page.row.values.get("--trace-progress"), "1");
  page.scroll(-20);
  page.flush();
  assert.equal(page.frame.values.get("--reading-progress"), "0");
  page.cleanup();
});

test("a menu destination stays selected during travel and pulses on arrival", () => {
  const page = fixture();
  page.click("contact");
  page.scroll(900);
  page.flush();
  assert.deepEqual(page.active(), ["#contact"]);
  assert.equal(page.pulses.length, 0);
  page.scroll(1600);
  page.settle();
  assert.deepEqual(page.active(), ["#contact"]);
  assert.equal(page.pulses.at(-1)?.id, "contact");
  page.cleanup();
});

test("short clicked sections stay selected even when the final section is also visible", () => {
  const page = fixture(false, [0, 1800, 2200]);
  page.click("resume");
  page.scroll(1600);
  page.settle();
  assert.deepEqual(page.active(), ["#resume"]);
  page.view.location.hash = "#resume";
  page.view.emit("hashchange");
  page.flush();
  assert.deepEqual(page.active(), ["#resume"]);
  page.view.emit("wheel");
  page.flush();
  assert.deepEqual(page.active(), ["#contact"]);
  page.cleanup();
});

test("history hash changes select their destination without altering the URL", () => {
  const page = fixture(false, [0, 1800, 2200]);
  page.click("contact");
  page.scroll(1600);
  page.settle();
  page.view.location.hash = "#resume";
  page.view.emit("hashchange");
  page.settle();
  assert.deepEqual(page.active(), ["#resume"]);
  assert.equal(page.view.location.hash, "#resume");
  page.cleanup();
});

test("manual input cancels a pending destination instead of fighting the visitor", () => {
  const page = fixture();
  page.click("contact");
  page.scroll(1000);
  page.view.emit("wheel");
  page.settle();
  assert.deepEqual(page.active(), ["#resume"]);
  assert.equal(page.timers.size, 0);
  page.cleanup();
});

test("reduced motion cancels decoration while section tracking remains usable", () => {
  const page = fixture(true);
  page.scroll(1000);
  page.flush();
  assert.deepEqual(page.active(), ["#resume"]);
  assert.equal(page.pulses.length, 0);
  page.reduce(false);
  page.scroll(1600);
  page.flush();
  assert.equal(page.pulses.length, 1);
  page.reduce(true);
  assert.equal(page.pulses[0].cancelled, true);
  page.cleanup();
});

test("cleanup cancels pending work and releases every event listener", () => {
  const page = fixture();
  page.click("resume");
  page.scroll(700);
  page.cleanup();
  assert.equal(page.frames.size, 0);
  assert.equal(page.timers.size, 0);
  assert.equal(page.view.listeners.size, 0);
  assert.equal(page.nav.listeners.size, 0);
  assert.equal(page.motion.listeners.size, 0);
  assert.deepEqual(page.active(), []);
});
