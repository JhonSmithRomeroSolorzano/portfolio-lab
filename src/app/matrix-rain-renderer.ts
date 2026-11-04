import { observeCanvas } from "../shared/canvas/observe-canvas";
import { motionQuery } from "../shared/motion/motion-preference";
import {
  paintMatrixGlyphs,
  RAIN_LEVELS as levels,
  RAIN_TILE_WIDTH as tileWidth,
  RAIN_TILE_HEIGHT as tileHeight,
} from "../shared/canvas/matrix-glyphs";
import {
  RAIN_GLYPHS,
  rainEnvelope,
  rainColumn,
  rainCellLight,
  rainSeed,
} from "./matrix-rain-model";
import type { RainBoundary } from "./matrix-rain-model";
import { currentRainName, RAIN_NAME_CHANGE } from "../shared/canvas/rain-name";
import type { RainNameStencil } from "../shared/canvas/rain-name";
import {
  NAME_RAIN_DURATION,
  nameRainCoverage,
  nameRainReveal,
  nameRainSeed,
} from "../shared/canvas/rain-name-model";

export type MatrixRainRenderer = {
  setPaused(paused: boolean): void;
  dispose(): void;
};

const boundarySelector =
  ".identity-rail, .workbench-intro, .technology-overview, .stack-map, #resume, #contact, .collection-index";

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
  let paintedLevels = new Int8Array(0);
  let paintedGlyphs = new Uint16Array(0);
  let streams: ReturnType<typeof rainColumn>[] = [];
  let name: RainNameStencil | undefined;
  let nameStarted = 0;
  let nameReported = false;
  let nameVisible = false;
  let nameWeights = new Float32Array(0);
  let nameSeeds = new Float32Array(0);
  const nameCells: number[] = [];
  const nameLight = document.createElement("canvas");
  const nameInk = nameLight.getContext("2d");
  const nameBloom = document.createElement("canvas");
  const bloomInk = nameBloom.getContext("2d");
  let nameLeft = 0;
  let nameTop = 0;
  let rainHead = "";
  let nameGeometry = "";
  let nameLightingDirty = true;
  let namePaintedTime = -1;
  let namePaintedReveal = -1;

  function completeName() {
    if (!name) return;
    if (nameReported && !name.reveal) return;
    name.reveal = false;
    nameStarted = time - NAME_RAIN_DURATION / 1000;
    name.heading.dataset.nameEntrance = "complete";
    if (!nameReported) {
      nameReported = true;
      name.complete();
    }
  }

  function measureName() {
    const next = currentRainName();
    if (next !== name) {
      name?.activate(false);
      name = next;
      nameStarted = time - (name?.reveal ? 0 : NAME_RAIN_DURATION / 1000);
      nameReported = false;
      nameGeometry = "";
      nameLightingDirty = true;
      if (name)
        name.heading.dataset.nameEntrance = name.reveal
          ? "running"
          : "complete";
    }
    if (!name || !nameInk || !bloomInk) {
      for (const index of nameCells) paintedLevels[index] = levels;
      nameWeights.fill(0);
      nameCells.length = 0;
      nameVisible = false;
      return;
    }
    name.activate(true);
    const box = name.heading.getBoundingClientRect();
    if (
      !name.reveal ||
      motion.matches ||
      document.hidden ||
      box.bottom <= 0 ||
      box.top >= height
    )
      completeName();
    nameVisible = box.bottom > 0 && box.top < height;
    const geometry = `${box.left},${box.top},${columns},${rows},${spacing},${line}`;
    if (nameGeometry === geometry) return;
    nameGeometry = geometry;
    nameLightingDirty = true;
    for (const index of nameCells) paintedLevels[index] = levels;
    nameWeights.fill(0);
    nameCells.length = 0;
    if (!nameVisible) return;
    nameLeft = box.left;
    nameTop = box.top - name.padding;
    const ratio = ctx!.getTransform().a;
    const lightWidth = Math.ceil(name.width * ratio);
    const lightHeight = Math.ceil(name.height * ratio);
    if (nameLight.width !== lightWidth) nameLight.width = lightWidth;
    if (nameLight.height !== lightHeight) nameLight.height = lightHeight;
    if (nameBloom.width !== lightWidth) nameBloom.width = lightWidth;
    if (nameBloom.height !== lightHeight) nameBloom.height = lightHeight;
    nameInk.setTransform(ratio, 0, 0, ratio, 0, 0);
    bloomInk.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const left = column * spacing - box.left;
        const top = row * line - box.top + name.padding;
        if (
          left + spacing < 0 ||
          top + line < 0 ||
          left >= name.width ||
          top >= name.height
        )
          continue;
        const coverage = nameRainCoverage(
          name.integral,
          name.width,
          name.height,
          left,
          top,
          left + spacing,
          top + line,
        );
        if (coverage <= 0) continue;
        const index = column * rows + row;
        // The CSS cutout already clips to exact letter alpha. Do not attenuate
        // thin strokes a second time by their fraction of the rain tile.
        nameWeights[index] = 1;
        nameCells.push(index);
      }
    }
    // Guarantee one early highlight even on a small phone's coarse rain grid.
    if (nameCells.length) nameSeeds[nameCells[0]] = 0;
  }

  function paintAtlas() {
    const css = getComputedStyle(canvas);
    const low = css.getPropertyValue("--rain-ink").trim();
    const head = css.getPropertyValue("--rain-head").trim();
    rainHead = head;
    nameLightingDirty = true;
    paintMatrixGlyphs(atlas, ink!, low, head);
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
    measureName();
  }

  function draw() {
    const revealTime = (time - nameStarted) * 1000;
    const repaintName =
      nameLightingDirty ||
      namePaintedTime !== time ||
      namePaintedReveal !== revealTime;
    let illuminated = 0;
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
        if (nameWeights[index] > 0) {
          const reveal = nameRainReveal(nameSeeds[index], revealTime);
          // Change ONLY the brightness of this existing rain cell. Same glyph,
          // same source atlas, same position, same clock, same falling front.
          if (reveal > 0.75) illuminated++;
        }
        if (intensity < 0.025) {
          if (
            paintedLevels[index] >= 0 ||
            (nameWeights[index] > 0 && repaintName)
          )
            ctx!.clearRect(column * spacing, row * line, spacing, line);
          paintedLevels[index] = -1;
          continue;
        }
        const level = Math.min(levels - 1, Math.floor(intensity * levels));
        // Per-cell mutation is slow and asynchronous; there is no sliding text strip.
        const change = Math.floor(time * rates[index]);
        const glyph = (symbols[index] + change) % RAIN_GLYPHS.length;
        // Quantized light and slowly mutating glyphs leave most cells unchanged.
        // Preserve those exact pixels rather than repainting the entire field.
        if (
          paintedLevels[index] === level &&
          paintedGlyphs[index] === glyph &&
          (!nameWeights[index] || !repaintName)
        )
          continue;
        ctx!.clearRect(column * spacing, row * line, spacing, line);
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
        paintedLevels[index] = level;
        paintedGlyphs[index] = glyph;
      }
    }
    if (name && nameVisible && nameInk && bloomInk && repaintName) {
      nameInk.globalCompositeOperation = "source-over";
      nameInk.clearRect(0, 0, name.width, name.height);
      for (const index of nameCells) {
        const column = Math.floor(index / rows);
        const row = index % rows;
        const depth = 0.66 + rainSeed(column, 7) * 0.34;
        const light = rainCellLight(streams[column], row, ambient[index], time);
        const level = Math.min(
          levels - 1,
          Math.floor((0.9 + light * 0.1) * levels),
        );
        const glyph =
          (symbols[index] + Math.floor(time * rates[index])) %
          RAIN_GLYPHS.length;
        nameInk.globalAlpha = nameRainReveal(nameSeeds[index], revealTime);
        nameInk.drawImage(
          atlas,
          glyph * tileWidth,
          level * tileHeight,
          tileWidth,
          tileHeight,
          column * spacing - nameLeft,
          row * line - nameTop,
          spacing * depth,
          line * depth,
        );
      }
      // This is a clipped lighting pass of the SAME cells, not another rain field.
      nameInk.globalAlpha = 1;
      // Blur the assembled light once, rather than filtering hundreds of glyphs
      // separately. This buffer adds glow only; it owns no glyphs or clock.
      bloomInk.globalCompositeOperation = "source-over";
      bloomInk.clearRect(0, 0, name.width, name.height);
      bloomInk.shadowColor = rainHead;
      bloomInk.shadowBlur = 3;
      bloomInk.drawImage(nameLight, 0, 0, name.width, name.height);
      bloomInk.shadowBlur = 0;
      bloomInk.globalCompositeOperation = "destination-in";
      bloomInk.drawImage(name.mask, 0, 0);
      ctx!.drawImage(nameBloom, nameLeft, nameTop, name.width, name.height);
    }
    nameLightingDirty = false;
    namePaintedTime = time;
    namePaintedReveal = revealTime;
    host.dataset.time = time.toFixed(3);
    if (name) {
      const data = name.heading.dataset;
      data.nameTime = time.toFixed(3);
      data.nameSamples = String(nameCells.length);
      data.nameIlluminated = String(illuminated);
      data.namePlaying = String(playing() && nameVisible);
      if (revealTime >= NAME_RAIN_DURATION) completeName();
    }
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
    measureName();
    draw();
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
      paintedLevels = new Int8Array(columns * rows).fill(-2);
      paintedGlyphs = new Uint16Array(columns * rows);
      nameWeights = new Float32Array(columns * rows);
      nameSeeds = new Float32Array(columns * rows);
      nameGeometry = "";
      ctx.clearRect(0, 0, width, height);
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
          nameSeeds[index] = nameRainSeed(index * 7 + 31);
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
  const nameChanged = () => {
    if (!disposed) {
      measureName();
      draw();
    }
  };
  window.addEventListener(RAIN_NAME_CHANGE, nameChanged);
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
      window.removeEventListener(RAIN_NAME_CHANGE, nameChanged);
      name?.activate(false);
      nameLight.width = nameLight.height = 1;
      nameBloom.width = nameBloom.height = 1;
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    },
  };
}
