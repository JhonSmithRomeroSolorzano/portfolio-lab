import assert from "node:assert/strict";
import test from "node:test";
import { createLoomPaintSurface } from "../src/features/playground/gravity-loom/paint-surface";
import { createLoomRenderer } from "../src/features/playground/gravity-loom/renderer";
import { defaultAttractors } from "../src/domain/playground/gravity-loom";

function canvasFixture() {
  const buffers: ReturnType<typeof makeCanvas>[] = [];
  const attached = new Set<HTMLCanvasElement>();
  let denyBuffer = false;
  function makeCanvas() {
    const state = {
      clears: 0,
      copies: 0,
      firstStroke: undefined as unknown,
      head: [] as number[],
      transform: [1, 0, 0, 1, 0, 0],
      stack: [] as number[][],
    };
    const ctx = {
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      lineCap: "butt",
      lineJoin: "miter",
      font: "",
      clearRect() {
        state.clears++;
        state.firstStroke = undefined;
      },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      fill() {},
      fillText() {},
      stroke() {
        state.firstStroke ??= {
          color: ctx.strokeStyle,
          alpha: ctx.globalAlpha,
        };
      },
      arc(x: number, y: number, radius: number) {
        if (radius === 1.5) state.head = [x, y];
      },
      getTransform() {
        const [a, b, c, d, e, f] = state.transform;
        return { a, b, c, d, e, f };
      },
      setTransform(...values: number[]) {
        state.transform = values;
      },
      save() {
        state.stack.push([...state.transform]);
      },
      restore() {
        state.transform = state.stack.pop()!;
      },
      drawImage() {
        state.copies++;
      },
    };
    const node = {
      width: 300,
      height: 150,
      lang: "",
      hidden: false,
      style: { display: "" },
      isConnected: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        node.attributes.set(name, value);
      },
      getAttribute(name: string) {
        return node.attributes.get(name) ?? null;
      },
      remove() {
        node.isConnected = false;
        attached.delete(node as unknown as HTMLCanvasElement);
      },
      cloneNode() {
        const next = makeCanvas();
        next.node.width = node.width;
        next.node.height = node.height;
        for (const [key, value] of node.attributes)
          next.node.setAttribute(key, value);
        buffers.push(next);
        return next.node;
      },
      ownerDocument: document,
      getContext: () => (denyBuffer ? null : ctx),
      getBoundingClientRect: () => ({ width: 318, height: 318 }),
    };
    return { node: node as unknown as HTMLCanvasElement, ctx, state };
  }
  const document = {
    documentElement: { lang: "en", dataset: { theme: "light" } },
    createElement: () => {
      const buffer = makeCanvas();
      buffers.push(buffer);
      return buffer.node;
    },
  };
  const host = {
    ownerDocument: document,
    getBoundingClientRect: () => ({ width: 318, height: 318 }),
    append(node: HTMLCanvasElement) {
      (node as unknown as { isConnected: boolean }).isConnected = true;
      attached.add(node);
    },
  } as unknown as HTMLElement;
  return {
    host,
    buffers,
    attached,
    document,
    deny: () => {
      denyBuffer = true;
    },
  };
}

test("Loom draws directly to one retained canvas and renews it only on palette changes", () => {
  const f = canvasFixture();
  const surface = createLoomPaintSurface(f.host)!;
  const first = surface.prepare("light", 0, 318, 318, 2);
  assert.ok(first);
  assert.deepEqual(f.buffers[0].state.transform, [2, 0, 0, 2, 0, 0]);
  assert.equal(f.buffers[0].node.width, 636);
  assert.equal(f.buffers[0].node.isConnected, true);
  assert.equal(f.buffers[0].node.hidden, false);
  f.buffers[0].node.setAttribute("data-annotation", "preserved");
  surface.finish(0);
  assert.equal(surface.prepare("light", 0, 318, 318, 2), undefined);
  for (let revision = 1; revision <= 120; revision++) {
    assert.equal(surface.prepare("light", revision, 318, 318, 2), first);
    surface.finish(revision);
  }
  assert.equal(f.buffers.length, 1);
  assert.equal(surface.prepare("light", 121, 500, 318, 2), first);
  assert.equal(f.buffers[0].node.width, 1000);
  surface.finish(121);
  for (const [i, palette] of ["dark", "light"].entries()) {
    assert.ok(surface.prepare(palette, 122 + i, 500, 318, 2));
    assert.equal(f.attached.size, 2);
    assert.equal(
      f.buffers[i + 1].node.getAttribute("data-annotation"),
      "preserved",
    );
    surface.finish(122 + i);
    assert.equal(f.attached.size, 1);
    assert.equal(f.buffers[i].node.width, 0);
    assert.equal(f.buffers[i].node.height, 0);
    assert.equal(f.buffers[i].node.isConnected, false);
  }
  assert.equal(f.buffers.filter((b) => b.node.width > 0).length, 1);
  surface.dispose();
  assert.ok(f.buffers.every((b) => b.node.width === 0 && b.node.height === 0));
  assert.ok(f.buffers.every((b) => !b.node.isConnected));
  assert.ok(f.buffers.every((b) => b.state.copies === 0));
  assert.equal(f.attached.size, 0);
  assert.equal(surface.prepare("light", 999, 500, 318, 2), undefined);
});

test("Loom paint surface reports allocation denial and releases its backing storage", () => {
  const f = canvasFixture();
  const surface = createLoomPaintSurface(f.host)!;
  surface.prepare("light", 0, 318, 318, 1);
  surface.finish(0);
  f.deny();
  assert.equal(surface.prepare("dark", 1, 318, 318, 1), null);
  surface.dispose();
  assert.ok(f.buffers.every((b) => b.node.width === 0 && b.node.height === 0));
  assert.equal(createLoomPaintSurface(f.host), undefined);
  assert.equal(f.attached.size, 0);
});

test("Loom palette epochs preserve live geometry, pause intent and cheap no-op controls", () => {
  const f = canvasFixture();
  const frames = new Map<number, FrameRequestCallback>();
  const observers: (() => void)[] = [];
  const observed: unknown[] = [];
  const listeners = new Map<string, () => void>();
  let id = 0;
  class Observer {
    constructor(callback: () => void) {
      observers.push(callback);
    }
    observe(target: unknown) {
      observed.push(target);
    }
    disconnect() {}
  }
  const globals = {
    document: f.document,
    window: {
      devicePixelRatio: 1,
      matchMedia: () => ({ matches: true }),
      addEventListener: (name: string, cb: () => void) =>
        listeners.set(name, cb),
      removeEventListener: (name: string) => listeners.delete(name),
    },
    ResizeObserver: Observer,
    MutationObserver: Observer,
    requestAnimationFrame: (cb: FrameRequestCallback) => {
      frames.set(++id, cb);
      return id;
    },
    cancelAnimationFrame: (key: number) => frames.delete(key),
    getComputedStyle: () => ({
      getPropertyValue: (name: string) =>
        (f.document.documentElement.dataset.theme === "dark"
          ? ["#ffcc8a", "#9ac8ff", "#7edaca"]
          : ["#975014", "#245da0", "#18756c"])[Number(name.at(-1)) - 1],
    }),
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
    const flush = (time: number) => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(time));
    };
    const notify = () => observers.forEach((cb) => cb());
    let unavailable = 0;
    const renderer = createLoomRenderer(f.host, () => {
      unavailable++;
    })!;
    renderer.configure(defaultAttractors, "orbit", 1, true);
    const preview = [...f.buffers.at(-1)!.state.head];
    const paints = f.buffers[0].state.clears;
    for (let i = 0; i < 60; i++) {
      renderer.select(0);
      renderer.release();
      renderer.configure(defaultAttractors, "orbit", 1, true);
    }
    assert.equal(f.buffers[0].state.clears, paints);
    assert.equal(f.buffers.length, 1);
    assert.deepEqual(observed, [f.host, f.document.documentElement]);
    renderer.play();
    flush(100);
    flush(140);
    const live = [...f.buffers.at(-1)!.state.head];
    assert.notDeepEqual(live, preview);
    renderer.pause();
    f.document.documentElement.dataset.theme = "dark";
    // A controller redraw before observer delivery must keep both old colors
    // and old opacity, not combine root metadata with a stale palette.
    renderer.select(1);
    assert.deepEqual(f.buffers.at(-1)!.state.firstStroke, {
      color: "#975014",
      alpha: 0.025,
    });
    notify();
    flush(140);
    assert.deepEqual(f.buffers.at(-1)!.state.head, live);
    assert.deepEqual(f.buffers.at(-1)!.state.firstStroke, {
      color: "#ffcc8a",
      alpha: 0.04,
    });
    assert.equal(frames.size, 0);
    f.document.documentElement.dataset.theme = "light";
    notify();
    flush(140);
    assert.deepEqual(f.buffers.at(-1)!.state.head, live);
    renderer.play();
    flush(200);
    flush(240);
    assert.notDeepEqual(f.buffers.at(-1)!.state.head, live);
    const allocations = f.buffers.length;
    for (let i = 0; i < 60; i++) flush(260 + i * 20);
    assert.equal(f.buffers.length, allocations);
    assert.deepEqual(observed, [f.host, f.document.documentElement]);
    f.deny();
    f.document.documentElement.dataset.theme = "dark";
    notify();
    flush(1440);
    assert.equal(unavailable, 1);
    assert.equal(frames.size, 0);
    assert.equal(listeners.size, 0);
    assert.ok(
      f.buffers.every((b) => b.node.width === 0 && b.node.height === 0),
    );
    renderer.dispose();
    renderer.play();
    assert.equal(frames.size, 0);
    assert.equal(f.attached.size, 0);
  } finally {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
