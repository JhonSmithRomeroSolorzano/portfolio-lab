import {
  airPoint,
  approachSpool,
  enginePower,
  flowOpacity,
  ENGINE_CENTER,
} from "../../../domain/playground/jet-engine";
import { depth, engineFaces, project } from "./mesh";

export function createEngineRenderer(
  canvas: HTMLCanvasElement,
  onFailure: () => void,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const routes = window.matchMedia("(max-width: 600px)").matches ? 18 : 36;
  let target = 35,
    spool = 35,
    angle = 0,
    clock = 0,
    playing = false,
    still = false,
    frame = 0,
    previous = 0;
  let width = 1,
    height = 1;
  let cool = "#287cc0",
    hot = "#c85b21",
    edge = "#516c80",
    metal: string[] = [];
  let coolRgb = [36, 122, 185],
    hotRgb = [195, 91, 32];
  const path = (
    points: readonly (readonly [number, number])[],
    close = false,
  ) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  };
  function palette() {
    const css = getComputedStyle(canvas);
    cool = css.getPropertyValue("--engine-cool").trim();
    hot = css.getPropertyValue("--engine-hot").trim();
    edge = css.getPropertyValue("--engine-edge").trim();
    metal = Array.from({ length: 5 }, (_, i) =>
      css.getPropertyValue(`--engine-metal-${i}`).trim(),
    );
    coolRgb = [1, 3, 5].map((offset) =>
      parseInt(cool.slice(offset, offset + 2), 16),
    );
    hotRgb = [1, 3, 5].map((offset) =>
      parseInt(hot.slice(offset, offset + 2), 16),
    );
  }
  function draw() {
    if (!ctx) return;
    const power = enginePower(spool);
    ctx.setTransform(canvas.width / 1100, 0, 0, canvas.height / 480, 0, 0);
    ctx.clearRect(0, 0, 1100, 480);
    // A translucent volume represents heated air, not an afterburner flame.
    if (power.throttle > 0) {
      const start = project([145, 0, ENGINE_CENTER]),
        end = project([145 + power.reach, 0, ENGINE_CENTER]);
      const gradient = ctx.createLinearGradient(
        start[0],
        start[1],
        end[0],
        end[1],
      );
      gradient.addColorStop(0, hot);
      gradient.addColorStop(1, "transparent");
      const top = [],
        bottom = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30,
          r =
            (11 + power.throttle * 10) *
            Math.sin(Math.PI * (0.12 + t * 0.88)) *
            (1 - t * 0.4);
        top.push(project([145 + power.reach * t, 0, ENGINE_CENTER + r]));
        bottom.push(project([145 + power.reach * t, 0, ENGINE_CENTER - r]));
      }
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.13 + power.heat * 0.08;
      path([...top, ...bottom.reverse()], true);
      ctx.fill();
    }
    type Trace = {
      points: [number, number][];
      alpha: number;
      heat: number;
      depth: number;
      width: number;
    };
    const traces: Trace[] = [];
    for (let route = 0; route < routes; route++) {
      // Quiet guide streams retain the route while particles make speed visible.
      if (power.throttle > 0) {
        const points = Array.from({ length: 45 }, (_, i) =>
          project(airPoint(route, i / 44, power)),
        );
        ctx.globalAlpha = 0.045 + power.throttle * 0.045;
        ctx.strokeStyle = cool;
        ctx.lineWidth = 0.7;
        path(points);
        ctx.stroke();
      }
      for (let slot = 0; slot < 22; slot++) {
        const density = Math.max(0, Math.min(1, power.density - slot));
        if (!density) continue;
        const u = (((slot / 22 + route * 0.037 + clock * 0.085) % 1) + 1) % 1;
        const point = airPoint(route, u, power);
        const trail = (0.008 + power.throttle * 0.025) * (still ? 0.7 : 1);
        const points = Array.from({ length: 5 }, (_, i) =>
          project(airPoint(route, Math.max(0, u - trail * (1 - i / 4)), power)),
        );
        traces.push({
          points,
          alpha: density * flowOpacity(u) * (0.38 + power.throttle * 0.38),
          heat:
            route % 3 === 0 ? Math.max(0, Math.min(1, (point[0] + 8) / 32)) : 0,
          depth: depth(point),
          width: route % 3 === 0 ? 1.5 : 1.05,
        });
      }
    }
    const faces = engineFaces(angle);
    let fi = 0,
      ti = 0;
    traces.sort((a, b) => a.depth - b.depth);
    while (fi < faces.length || ti < traces.length) {
      if (
        ti < traces.length &&
        (fi === faces.length || traces[ti].depth < faces[fi].depth)
      ) {
        const trace = traces[ti++];
        ctx.globalAlpha = trace.alpha;
        const color =
          trace.heat === 0
            ? cool
            : trace.heat === 1
              ? hot
              : `rgb(${coolRgb.map((value, i) => Math.round(value + (hotRgb[i] - value) * trace.heat)).join(",")})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = trace.width;
        ctx.lineCap = "round";
        path(trace.points);
        ctx.stroke();
        const tip = trace.points[trace.points.length - 1];
        ctx.globalAlpha = trace.alpha * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], 1.1 + power.throttle * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const face = faces[fi++];
        ctx.globalAlpha = 1;
        ctx.fillStyle = metal[face.shade];
        ctx.strokeStyle = edge;
        ctx.lineWidth = 0.55;
        path(face.points, true);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    canvas.dataset.spool = spool.toFixed(2);
    canvas.dataset.phase = angle.toFixed(3);
    canvas.dataset.flow = power.flow.toFixed(3);
    canvas.dataset.reach = power.reach.toFixed(2);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  function tick(now: number) {
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    spool = approachSpool(spool, target, dt);
    const power = enginePower(spool);
    angle = (angle + dt * power.rotation) % (Math.PI * 2 * 5);
    clock += dt * power.flow;
    draw();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    draw();
  }
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : undefined;
  resizeObserver?.observe(canvas);
  window.addEventListener("resize", resize);
  const themeObserver = new MutationObserver(() => {
    palette();
    draw();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const lost = () => {
    pause();
    onFailure();
  };
  canvas.addEventListener("contextlost", lost);
  palette();
  resize();
  return {
    configure(speed: number, reduced: boolean) {
      target = speed;
      still = reduced;
      if (speed === 0) pause();
      if (reduced || !playing) {
        spool = target;
        draw();
      }
    },
    play() {
      if (playing || still || target === 0) return;
      playing = true;
      previous = 0;
      frame = requestAnimationFrame(tick);
    },
    pause,
    reset(speed: number) {
      pause();
      target = spool = speed;
      angle = clock = 0;
      draw();
    },
    dispose() {
      pause();
      resizeObserver?.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("contextlost", lost);
    },
  };
}
