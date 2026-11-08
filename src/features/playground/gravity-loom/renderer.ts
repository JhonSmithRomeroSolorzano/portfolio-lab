import {
  createLoomScene,
  seedLoom,
  stepLoom,
  type LoomFlow,
  type LoomPoint,
} from "../../../domain/playground/gravity-loom";
import { loomViewport, projectLoomPoint } from "./viewport";
import { observeCanvasEnvironment } from "../../../shared/canvas/observe-canvas";
import { createLoomPaintSurface } from "./paint-surface";

/** Bounded histories retain the woven trails without persistent canvas overdraw. */
export function createLoomRenderer(
  host: HTMLElement,
  onUnavailable: () => void = () => {},
) {
  const candidateSurface = createLoomPaintSurface(host);
  if (!candidateSurface) return undefined;
  const surface = candidateSurface;
  const count = window.matchMedia("(max-width: 600px)").matches ? 48 : 96;
  let particles = seedLoom(count);
  let trails: LoomPoint[][] = [];
  let attractors: readonly LoomPoint[] = [];
  let flow: LoomFlow = "orbit";
  let strength = 1;
  let frame = 0;
  let previous = 0;
  let accumulator = 0;
  let playing = false;
  let ready = false;
  let selected = 0;
  let held: number | undefined;
  let boost: number | undefined;
  let boostRemaining = 0;
  let width = 1;
  let ratio = 1;
  let height = 1;
  let colors: string[] = [];
  let dark = false;
  let paintPalette = "";
  let revision = 0;
  let preview = false;
  let unavailable = false;
  let stopObserving = () => {};

  function samePoints(next: readonly LoomPoint[]) {
    return (
      next.length === attractors.length &&
      next.every((p, i) => p.x === attractors[i].x && p.y === attractors[i].y)
    );
  }

  function draw() {
    if (unavailable) return;
    const ctx = surface.prepare(paintPalette, revision, width, height, ratio);
    if (ctx === null) {
      unavailable = true;
      pause();
      stopObserving();
      surface.dispose();
      onUnavailable();
      return;
    }
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const viewport = loomViewport(width, height);
    trails.forEach((trail, i) => {
      const trace = () => {
        ctx.beginPath();
        trail.forEach((p, j) => {
          const { x, y } = projectLoomPoint(p, viewport);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      };
      ctx.strokeStyle = colors[i % 3];
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      trace();
      ctx.lineWidth = 5;
      ctx.globalAlpha = dark ? 0.04 : 0.025;
      ctx.stroke();
      ctx.lineWidth = width < 600 ? 0.8 : 1;
      ctx.globalAlpha = dark ? 0.6 : 0.5;
      ctx.stroke();
      const head = trail.at(-1);
      if (head) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = colors[i % 3];
        ctx.beginPath();
        const projected = projectLoomPoint(head, viewport);
        ctx.arc(projected.x, projected.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    attractors.forEach((p, i) => {
      const { x, y } = projectLoomPoint(p, viewport);
      ctx.strokeStyle = colors[0];
      if (i === selected) {
        ctx.fillStyle = ctx.strokeStyle;
        ctx.globalAlpha = i === held ? 0.2 : 0.08;
        ctx.beginPath();
        ctx.arc(x, y, i === held ? 30 : 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.lineWidth = i === selected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, i === held ? 18 : i === selected ? 14 : 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colors[0];
      ctx.font = "11px monospace";
      ctx.fillText(String(i + 1), x + 14, y - 12);
    });
    surface.finish(revision);
  }
  function tick(now: number) {
    if (previous) accumulator += Math.min((now - previous) / 1000, 0.05);
    previous = now;
    while (accumulator >= 1 / 60) {
      particles = stepLoom(
        particles,
        attractors,
        flow,
        strength,
        held ?? (boostRemaining > 0 ? boost : undefined),
      );
      boostRemaining = Math.max(0, boostRemaining - 1 / 60);
      particles.forEach((p, i) => {
        trails[i].push({ x: p.x, y: p.y });
        if (trails[i].length > 90) trails[i].shift();
      });
      accumulator -= 1 / 60;
      preview = false;
      revision++;
    }
    draw();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function pause() {
    cancelAnimationFrame(frame);
    playing = false;
    previous = 0;
    accumulator = 0;
  }
  function resetScene() {
    const scene = createLoomScene(attractors, flow, strength, count);
    particles = scene.particles;
    trails = scene.trails;
    ready = true;
    preview = true;
    revision++;
    held = undefined;
    boost = undefined;
    boostRemaining = 0;
  }
  stopObserving = observeCanvasEnvironment(
    host,
    (nextWidth, nextHeight, nextRatio) => {
      ratio = nextRatio;
      width = nextWidth;
      height = nextHeight;
      const css = getComputedStyle(host);
      colors = ["--loom-thread-1", "--loom-thread-2", "--loom-thread-3"].map(
        (name) => css.getPropertyValue(name).trim(),
      );
      // Cache opacity mode and colors together; control redraws must not combine
      // a new root theme with the previous observer-delivered palette.
      dark = document.documentElement.dataset.theme === "dark";
      paintPalette = `${dark}:${colors.join(",")}`;
      revision++;
      draw();
    },
  );
  return {
    configure(
      next: readonly LoomPoint[],
      mode: LoomFlow,
      force: number,
      staticMode = false,
    ) {
      // Flow and force affect future steps, not the already woven trails.
      // Preserve paused pixels instead of rasterizing the same paths again.
      const moved = !samePoints(next);
      const changed = moved || flow !== mode || strength !== force;
      attractors = next;
      flow = mode;
      strength = force;
      if (!ready || (staticMode && (!preview || changed))) resetScene();
      else {
        if (changed) preview = false;
        if (moved) revision++;
      }
      draw();
    },
    move(next: readonly LoomPoint[], staticMode: boolean) {
      const moved = !samePoints(next);
      attractors = next;
      if (staticMode && (moved || !preview)) resetScene();
      else if (moved) {
        preview = false;
        revision++;
      }
      draw();
    },
    select(index: number) {
      if (selected === index) return;
      selected = index;
      revision++;
      draw();
    },
    grab(index: number) {
      if (held === index) return;
      held = index;
      revision++;
      draw();
    },
    release() {
      const changed = held !== undefined;
      boost = held;
      boostRemaining = 0.65;
      held = undefined;
      if (changed) {
        revision++;
        draw();
      }
    },
    nudge(index: number) {
      boost = index;
      boostRemaining = 0.65;
    },
    reset(next: readonly LoomPoint[], mode: LoomFlow, force: number) {
      pause();
      const changed =
        !ready ||
        !preview ||
        !samePoints(next) ||
        flow !== mode ||
        strength !== force;
      const markerChanged = selected !== 0 || held !== undefined;
      attractors = next;
      flow = mode;
      strength = force;
      selected = 0;
      if (changed) resetScene();
      else {
        held = undefined;
        boost = undefined;
        boostRemaining = 0;
      }
      if (markerChanged) revision++;
      draw();
    },
    play() {
      if (playing || unavailable) return;
      playing = true;
      frame = requestAnimationFrame(tick);
    },
    pause,
    dispose() {
      pause();
      unavailable = true;
      stopObserving();
      surface.dispose();
    },
  };
}
