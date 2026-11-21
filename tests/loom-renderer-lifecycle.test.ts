import assert from "node:assert/strict";
import test from "node:test";
import { createLoomPaintSurface } from "../src/features/playground/gravity-loom/paint-surface";
import { createLoomRenderer } from "../src/features/playground/gravity-loom/renderer";
import {
  createLoomScene,
  defaultAttractors,
  stepLoom,
  type LoomPoint,
} from "../src/domain/playground/gravity-loom";

function canvasFixture(record = false) {
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
      commands: [] as (string | number)[][],
    };
    const command = (...args: (string | number)[]) => {
      if (record) state.commands.push(args);
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
      clearRect(x: number, y: number, width: number, height: number) {
        state.clears++;
        state.firstStroke = undefined;
        state.commands = [];
        command("clearRect", x, y, width, height);
      },
      beginPath() {
        command("beginPath");
      },
      moveTo(x: number, y: number) {
        command("moveTo", x, y);
      },
      lineTo(x: number, y: number) {
        command("lineTo", x, y);
      },
      fill() {
        command("fill", ctx.fillStyle, ctx.globalAlpha);
      },
      fillText(text: string, x: number, y: number) {
        command("fillText", text, x, y);
      },
      stroke() {
        command("stroke", ctx.strokeStyle, ctx.lineWidth, ctx.globalAlpha);
        state.firstStroke ??= {
          color: ctx.strokeStyle,
          alpha: ctx.globalAlpha,
        };
      },
      arc(x: number, y: number, radius: number, start: number, end: number) {
        command("arc", x, y, radius, start, end);
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

/** Original allocating projection/draw order, independent of scalar helpers. */
function referenceCommands(
  trails: readonly (readonly LoomPoint[])[],
  attractors: readonly LoomPoint[],
  dark = false,
  selected = 0,
  held?: number,
) {
  const commands: (string | number)[][] = [];
  const command = (...args: (string | number)[]) => commands.push(args);
  const project = (p: LoomPoint) => ({
    x: 159 + p.x * 135,
    y: 159 + p.y * 135,
  });
  const colors = dark
    ? ["#ffcc8a", "#9ac8ff", "#7edaca"]
    : ["#975014", "#245da0", "#18756c"];
  command("clearRect", 0, 0, 318, 318);
  for (const [i, trail] of trails.entries()) {
    command("beginPath");
    trail.forEach((p, j) => {
      const { x, y } = project(p);
      command(j ? "lineTo" : "moveTo", x, y);
    });
    command("stroke", colors[i % 3], 5, dark ? 0.04 : 0.025);
    command("stroke", colors[i % 3], 0.8, dark ? 0.6 : 0.5);
    const head = trail.at(-1);
    if (head) {
      const { x, y } = project(head);
      command("beginPath");
      command("arc", x, y, 1.5, 0, Math.PI * 2);
      command("fill", colors[i % 3], 0.9);
    }
  }
  for (const [i, point] of attractors.entries()) {
    const { x, y } = project(point);
    if (i === selected) {
      command("beginPath");
      command("arc", x, y, i === held ? 30 : 24, 0, Math.PI * 2);
      command("fill", colors[0], i === held ? 0.2 : 0.08);
    }
    command("beginPath");
    command(
      "arc",
      x,
      y,
      i === held ? 18 : i === selected ? 14 : 10,
      0,
      Math.PI * 2,
    );
    command("stroke", colors[0], i === selected ? 2 : 1, 1);
    command("beginPath");
    command("arc", x, y, 3, 0, Math.PI * 2);
    command("stroke", colors[0], i === selected ? 2 : 1, 1);
    command("fillText", String(i + 1), x + 14, y - 12);
  }
  return commands;
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
  const f = canvasFixture(true);
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
    const scene = createLoomScene(defaultAttractors, "orbit", 1, 48);
    const step = (
      count: number,
      points: readonly LoomPoint[] = defaultAttractors,
      flow: "orbit" | "weave" = "orbit",
      strength = 1,
      held?: number,
    ) => {
      for (let i = 0; i < count; i++) {
        scene.particles = stepLoom(
          scene.particles,
          points,
          flow,
          strength,
          held,
        );
        scene.particles.forEach((p, index) => {
          scene.trails[index].push({ x: p.x, y: p.y });
          if (scene.trails[index].length > 90) scene.trails[index].shift();
        });
      }
    };
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, defaultAttractors),
    );
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
    step(2);
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, defaultAttractors),
    );
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
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, defaultAttractors, true, 1),
    );
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
    step(2);
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, defaultAttractors, false, 1),
    );
    assert.notDeepEqual(f.buffers.at(-1)!.state.head, live);
    const moved = [{ x: -0.8, y: 0.6 }, defaultAttractors[1]];
    renderer.move(moved, false);
    renderer.select(0);
    renderer.configure(moved, "weave", 1.5);
    renderer.grab(0);
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, moved, false, 0, 0),
    );
    flush(260);
    step(1, moved, "weave", 1.5, 0);
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, moved, false, 0, 0),
    );
    renderer.release();
    assert.deepEqual(
      f.buffers.at(-1)!.state.commands,
      referenceCommands(scene.trails, moved),
    );
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
