import {
  approachSculptureView,
  morphPoint,
  projectSculpturePoint,
  sculpturePoints,
  type SculptureForm,
} from "../../../domain/playground/signal-sculpture";

/** Canvas owns pixels and the clock; React owns controls, not per-frame state. */
export function createSculptureRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const count = window.matchMedia("(max-width: 600px)").matches ? 720 : 1800;
  let form: SculptureForm = "monogram";
  let points = sculpturePoints(form, count);
  let from = points;
  let destination = points;
  let elapsed = 0;
  let transition = 1;
  let pulse = 10;
  let playing = false;
  let frame = 0;
  let previous = 0;
  let width = 1;
  let height = 1;
  let pointer = { x: 0, y: 0 };
  let pointerTarget = { x: 0, y: 0 };

  function draw() {
    if (!ctx) return;
    const dark = document.documentElement.dataset.theme === "dark";
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width * 0.46, height * 0.73);
    // A full, slow turn makes the monogram's perspective/depth perceptible.
    // The same paused clock keeps rotation frozen between explicit plays.
    const tilt = elapsed * (form === "monogram" ? 0.24 : 0.14);
    const projected = points
      .map((point, i) => {
        const wave =
          Math.exp(
            -Math.pow((Math.hypot(point.x, point.y) - pulse * 0.65) * 9, 2),
          ) * 0.12;
        const projected = projectSculpturePoint(
          { ...point, z: point.z + wave },
          tilt,
          pointer,
        );
        return {
          x: width / 2 + projected.x * scale,
          y: height / 2 + projected.y * scale,
          depth: projected.depth,
          i,
        };
      })
      .sort((a, b) => a.depth - b.depth);
    for (const p of projected) {
      const amber = p.i % 19 === 0;
      ctx.fillStyle = amber
        ? dark
          ? "#ffd59a"
          : "#92550f"
        : dark
          ? "#8cbfff"
          : "#245da0";
      const radius = (width < 600 ? 1 : 1.2) + (p.depth + 0.6) * 0.65;
      ctx.globalAlpha = 0.035;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.min(0.95, 0.4 + (p.depth + 0.6) * 0.45);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function tick(now: number) {
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    pointer = approachSculptureView(pointer, pointerTarget, dt);
    elapsed += dt;
    pulse += dt;
    transition = Math.min(1, transition + dt / 1.8);
    points =
      transition < 1
        ? destination.map((p, i) => morphPoint(from[i], p, transition, i))
        : destination;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    previous = 0;
    // Preserve frozen pixels; a later Play eases back from the saved view.
    pointerTarget = { x: 0, y: 0 };
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
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : undefined;
  resizeObserver?.observe(canvas);
  window.addEventListener("resize", resize);
  const themeObserver = new MutationObserver(draw);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  resize();
  return {
    settle() {
      points = destination;
      transition = 1;
      pointer = { x: 0, y: 0 };
      pointerTarget = { x: 0, y: 0 };
      elapsed = 0;
      pulse = 10;
      draw();
    },
    setForm(next: SculptureForm, instant: boolean) {
      if (next === form && !instant) return;
      form = next;
      from = points;
      destination = sculpturePoints(next, count);
      transition = instant ? 1 : 0;
      if (instant) points = destination;
      draw();
    },
    play() {
      if (playing) return;
      playing = true;
      frame = requestAnimationFrame(tick);
    },
    pause,
    pulse() {
      pulse = 0;
    },
    pointer(x: number, y: number) {
      pointerTarget = { x, y };
    },
    reset() {
      pause();
      elapsed = 0;
      pulse = 10;
      pointer = { x: 0, y: 0 };
      pointerTarget = { x: 0, y: 0 };
    },
    dispose() {
      pause();
      resizeObserver?.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
    },
  };
}
