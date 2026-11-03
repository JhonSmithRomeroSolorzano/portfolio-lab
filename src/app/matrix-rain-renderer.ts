import { observeCanvas } from "../shared/canvas/observe-canvas";
import { motionQuery } from "../shared/motion/motion-preference";
import {
  RAIN_GLYPHS,
  rainEnvelope,
  rainColumn,
  rainCellLight,
  rainSeed,
} from "./matrix-rain-model";
import type { RainBoundary } from "./matrix-rain-model";

export type MatrixRainRenderer = {
  setPaused(paused: boolean): void;
  dispose(): void;
};

const boundarySelector =
  ".identity-rail, .workbench-intro, .technology-overview, .stack-map, #resume, #contact, .collection-index";
const levels = 24;
const tileWidth = 12;
const tileHeight = 16;

export function createMatrixRain(
  canvas: HTMLCanvasElement,
): MatrixRainRenderer | undefined {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const host = canvas.parentElement!;
  const atlas = document.createElement("canvas");
  atlas.width = RAIN_GLYPHS.length * tileWidth;
  atlas.height = levels * tileHeight;
  const ink = atlas.getContext("2d");
  if (!ink) return;
  const motion = motionQuery();
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let spacing = 9;
  let line = 13;
  let time = 0;
  let last = 0;
  let frame = 0;
  let layoutFrame = 0;
  let paused = true;
  let disposed = false;
  let quiet = new Float32Array(0);
  let edges = new Float32Array(0);
  let ambient = new Float32Array(0);
  let rates = new Float32Array(0);
  let symbols = new Uint16Array(0);
  let streams: ReturnType<typeof rainColumn>[] = [];

  function paintAtlas() {
    const css = getComputedStyle(canvas);
    const low = css.getPropertyValue("--rain-ink").trim();
    const head = css.getPropertyValue("--rain-head").trim();
    ink!.clearRect(0, 0, atlas.width, atlas.height);
    ink!.font = '14px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace';
    ink!.textAlign = "center";
    ink!.textBaseline = "middle";
    for (let level = 0; level < levels; level++) {
      const amount = (level + 1) / levels;
      ink!.globalAlpha = amount ** 0.8;
      ink!.fillStyle = level > levels * 0.86 ? head : low;
      ink!.shadowColor = head;
      ink!.shadowBlur = level > levels * 0.72 ? 3 : 0;
      for (let glyph = 0; glyph < RAIN_GLYPHS.length; glyph++) {
        ink!.save();
        ink!.translate(
          glyph * tileWidth + tileWidth / 2,
          level * tileHeight + tileHeight / 2,
        );
        if (glyph % 3) ink!.scale(-1, 1);
        ink!.fillText(RAIN_GLYPHS[glyph], 0, 0);
        ink!.restore();
      }
    }
    ink!.globalAlpha = 1;
    ink!.shadowBlur = 0;
  }

  function measure() {
    const boundaries: RainBoundary[] = [];
    for (const node of document.querySelectorAll<HTMLElement>(
      boundarySelector,
    )) {
      const box = node.getBoundingClientRect();
      if (!box.width || box.bottom < -20 || box.top > height + 20) continue;
      boundaries.push({
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      });
    }
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const mask = rainEnvelope(
          (column + 0.5) * spacing,
          row * line + line / 2,
          boundaries,
        );
        const index = column * rows + row;
        quiet[index] = mask.quiet;
        edges[index] = mask.edge;
      }
    }
    host.dataset.boundaries = String(boundaries.length);
  }

  function draw() {
    ctx!.clearRect(0, 0, width, height);
    for (let column = 0; column < columns; column++) {
      const depth = 0.66 + rainSeed(column, 7) * 0.34;
      for (let row = 0; row < rows; row++) {
        const index = column * rows + row;
        const light = rainCellLight(streams[column], row, ambient[index], time);
        const edge = edges[index];
        const intensity = Math.min(
          1,
          light * quiet[index] + edge * (0.07 + light * 0.8),
        );
        if (intensity < 0.025) continue;
        const level = Math.min(levels - 1, Math.floor(intensity * levels));
        // Per-cell mutation is slow and asynchronous; there is no sliding text strip.
        const change = Math.floor(time * rates[index]);
        const glyph = (symbols[index] + change) % RAIN_GLYPHS.length;
        ctx!.drawImage(
          atlas,
          glyph * tileWidth,
          level * tileHeight,
          tileWidth,
          tileHeight,
          column * spacing,
          row * line,
          spacing * depth,
          line * depth,
        );
      }
    }
    host.dataset.time = time.toFixed(3);
  }

  function playing() {
    return !disposed && !paused && !motion.matches && !document.hidden;
  }
  function tick(now: number) {
    frame = 0;
    if (!playing()) return;
    if (now - last >= 50) {
      time += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    host.dataset.playing = String(playing());
    host.dataset.hidden = String(document.hidden);
    if (playing()) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function layout() {
    layoutFrame = 0;
    if (disposed) return;
    measure();
    draw();
  }
  function scheduleLayout() {
    if (!disposed && !layoutFrame) layoutFrame = requestAnimationFrame(layout);
  }
  const stopObserving = observeCanvas(
    canvas,
    ctx,
    (nextWidth, nextHeight) => {
      width = nextWidth;
      height = nextHeight;
      // Bound the glyph grid and backing pixels on large/high-DPR displays.
      spacing = Math.max(width < 600 ? 7 : 9, width / 160, height / 110 / 1.5);
      line = spacing * 1.5;
      columns = Math.min(160, Math.ceil(width / spacing));
      rows = Math.min(110, Math.ceil(height / line));
      quiet = new Float32Array(columns * rows);
      edges = new Float32Array(columns * rows);
      ambient = new Float32Array(columns * rows);
      rates = new Float32Array(columns * rows);
      symbols = new Uint16Array(columns * rows);
      streams = Array.from({ length: columns }, (_, column) =>
        rainColumn(column, rows),
      );
      for (let column = 0; column < columns; column++) {
        for (let row = 0; row < rows; row++) {
          const index = column * rows + row;
          ambient[index] = 0.015 + rainSeed(column, row + 10) * 0.045;
          rates[index] = 0.5 + rainSeed(column, row) * 2;
          symbols[index] = Math.floor(
            rainSeed(column, row + 30) * RAIN_GLYPHS.length,
          );
        }
      }
      paintAtlas();
      measure();
      draw();
    },
    1.25,
  );
  const resize =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(scheduleLayout);
  const main = document.querySelector("main");
  if (main) resize?.observe(main);
  const header = document.querySelector(".identity-rail");
  if (header) resize?.observe(header);
  window.addEventListener("scroll", scheduleLayout, { passive: true });
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  host.dataset.renderer = "canvas";
  sync();

  return {
    setPaused(value) {
      paused = value;
      sync();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(layoutFrame);
      stopObserving();
      resize?.disconnect();
      window.removeEventListener("scroll", scheduleLayout);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    },
  };
}
