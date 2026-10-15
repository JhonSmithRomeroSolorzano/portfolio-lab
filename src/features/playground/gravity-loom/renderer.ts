import {
  createLoomScene,
  seedLoom,
  stepLoom,
  type LoomFlow,
  type LoomPoint,
} from "../../../domain/playground/gravity-loom";
import { loomViewport, projectLoomPoint } from "./viewport";

/** Bounded histories retain the woven trails without persistent canvas overdraw. */
export function createLoomRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
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
  let height = 1;

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const dark = document.documentElement.dataset.theme === "dark";
    const viewport = loomViewport(width, height);
    const colors = dark
      ? ["#ffcc8a", "#9ac8ff", "#7edaca"]
      : ["#975014", "#245da0", "#18756c"];
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
      ctx.strokeStyle = dark ? "#ffcc8a" : "#975014";
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
      ctx.fillStyle = dark ? "#ffcc8a" : "#975014";
      ctx.font = "11px monospace";
      ctx.fillText(String(i + 1), x + 14, y - 12);
    });
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
    }
    draw();
    frame = requestAnimationFrame(tick);
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
    held = undefined;
    boost = undefined;
    boostRemaining = 0;
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  const observer =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(resize);
  observer?.observe(canvas);
  window.addEventListener("resize", resize);
  const theme = new MutationObserver(draw);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  resize();
  return {
    configure(
      next: readonly LoomPoint[],
      mode: LoomFlow,
      force: number,
      staticMode = false,
    ) {
      attractors = next;
      flow = mode;
      strength = force;
      if (!ready || staticMode) resetScene();
      draw();
    },
    move(next: readonly LoomPoint[], staticMode: boolean) {
      attractors = next;
      if (staticMode) resetScene();
      draw();
    },
    select(index: number) {
      selected = index;
      draw();
    },
    grab(index: number) {
      held = index;
      draw();
    },
    release() {
      boost = held;
      boostRemaining = 0.65;
      held = undefined;
      draw();
    },
    nudge(index: number) {
      boost = index;
      boostRemaining = 0.65;
    },
    reset(next: readonly LoomPoint[], mode: LoomFlow, force: number) {
      pause();
      attractors = next;
      flow = mode;
      strength = force;
      selected = 0;
      resetScene();
      draw();
    },
    play() {
      if (playing) return;
      playing = true;
      frame = requestAnimationFrame(tick);
    },
    pause,
    dispose() {
      pause();
      observer?.disconnect();
      theme.disconnect();
      window.removeEventListener("resize", resize);
    },
  };
}
