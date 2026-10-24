import {
  airPoint,
  approachSpool,
  approachReverser,
  reverserFlowWeight,
  enginePower,
  flowOpacity,
  ENGINE_CENTER,
  type ThrustMode,
} from "../../../domain/playground/jet-engine";
import {
  triangulate,
  type DepthPoint,
} from "../../../domain/playground/engine-depth";
import { engineFaces, projectDepth, staticTriangles } from "./mesh";
import { EngineRaster, type Ink, type InkSample } from "./raster";

/** Opaque surfaces establish depth first; every air sample tests that same depth. */
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
  let reverseTarget = 0,
    deployment = 0,
    guideDeployment = NaN;
  let image: ImageData | undefined, raster: EngineRaster | undefined;
  let guideSpool = NaN,
    guideRaster: EngineRaster | undefined,
    guides: InkSample[] = [];
  let cool: Ink = [36, 122, 185],
    hot: Ink = [195, 91, 32],
    edge: Ink = [81, 110, 128],
    metal: Ink[] = [];
  const hex = (value: string): Ink =>
    [1, 3, 5].map((offset) =>
      parseInt(value.slice(offset, offset + 2), 16),
    ) as [number, number, number];
  function palette() {
    guideSpool = NaN;
    const css = getComputedStyle(canvas);
    cool = hex(css.getPropertyValue("--engine-cool").trim());
    hot = hex(css.getPropertyValue("--engine-hot").trim());
    edge = hex(css.getPropertyValue("--engine-edge").trim());
    metal = Array.from({ length: 5 }, (_, i) =>
      hex(css.getPropertyValue(`--engine-metal-${i}`).trim()),
    );
  }
  function ink(route: number, x: number): Ink {
    const heat = route % 3 === 0 ? Math.max(0, Math.min(1, (x + 8) / 32)) : 0;
    return heat === 0
      ? cool
      : heat === 1
        ? hot
        : (cool.map((value, i) =>
            Math.round(value + (hot[i] - value) * heat),
          ) as [number, number, number]);
  }
  function draw() {
    if (!ctx || !raster || !image) return;
    const r = raster,
      power = enginePower(spool),
      faces = engineFaces(angle, deployment);
    const reverseWeight = reverserFlowWeight(deployment);
    const streams = Array.from({ length: routes }, (_, route) =>
      route % 3 === 0
        ? [{ route, mode: "forward" as ThrustMode, weight: 1 }]
        : [
            { route, mode: "forward" as ThrustMode, weight: 1 - reverseWeight },
            { route, mode: "reverse" as ThrustMode, weight: reverseWeight },
          ],
    )
      .flat()
      .filter((stream) => stream.weight > 0.001);
    r.begin();
    for (const face of faces)
      for (let i = 0; i < face.triangles.length; i++)
        r.metal(face.triangles[i], metal[face.shade], face.boundaries[i]);
    // Queue edge coverage while scanning once, then test it against final depth.
    r.finishMetal();
    for (const face of faces)
      for (let i = 0; i < face.vertices.length; i++)
        r.line(
          face.vertices[i],
          face.vertices[(i + 1) % face.vertices.length],
          edge,
          0.55,
          1,
          0.008,
        );
    if (power.throttle > 0) {
      const start = projectDepth([145, 0, ENGINE_CENTER]),
        end = projectDepth([145 + power.reach, 0, ENGINE_CENTER]);
      const alpha = (x: number) =>
        Math.max(0, 1 - (x - start[0]) / (end[0] - start[0])) *
        (0.13 + power.heat * 0.08);
      const top: DepthPoint[] = [],
        bottom: DepthPoint[] = [];
      for (let i = 0; i <= 30; i++) {
        const u = i / 30,
          radius =
            (11 + power.throttle * 10) *
            Math.sin(Math.PI * (0.12 + u * 0.88)) *
            (1 - u * 0.4);
        top.push(
          projectDepth([145 + power.reach * u, 0, ENGINE_CENTER + radius]),
        );
        bottom.push(
          projectDepth([145 + power.reach * u, 0, ENGINE_CENTER - radius]),
        );
      }
      for (let i = 0; i < 30; i++)
        for (const t of triangulate([
          top[i],
          top[i + 1],
          bottom[i + 1],
          bottom[i],
        ]))
          r.volume(t, hot, alpha);
    }
    const traces: {
      points: DepthPoint[];
      alpha: number;
      color: Ink;
      depth: number;
      width: number;
    }[] = [];
    const drawGuides = (collect?: InkSample[]) => {
      if (power.throttle > 0)
        for (const { route, mode, weight } of streams) {
          let previous = airPoint(route, 0, power, mode);
          for (let i = 1; i <= 64; i++) {
            const point = airPoint(route, i / 64, power, mode);
            r.line(
              projectDepth(previous),
              projectDepth(point),
              ink(route, (previous[0] + point[0]) / 2),
              0.7,
              (0.045 + power.throttle * 0.045) * weight,
              0,
              collect,
            );
            previous = point;
          }
        }
    };
    if (spool === target && deployment === reverseTarget) {
      if (
        guideSpool !== spool ||
        guideRaster !== r ||
        guideDeployment !== deployment
      ) {
        guides = [];
        guideSpool = spool;
        guideRaster = r;
        guideDeployment = deployment;
        drawGuides(guides);
      }
      r.samples(guides);
    } else drawGuides();
    for (const { route, mode, weight } of streams) {
      for (let slot = 0; slot < 22; slot++) {
        const density = Math.max(0, Math.min(1, power.density - slot));
        if (!density) continue;
        const u = (((slot / 22 + route * 0.037 + clock * 0.085) % 1) + 1) % 1,
          point = airPoint(route, u, power, mode),
          trail = (0.008 + power.throttle * 0.025) * (still ? 0.7 : 1);
        const points = Array.from({ length: 3 }, (_, i) =>
          projectDepth(
            airPoint(route, Math.max(0, u - trail * (1 - i / 2)), power, mode),
          ),
        );
        traces.push({
          points,
          alpha:
            density * flowOpacity(u) * (0.38 + power.throttle * 0.38) * weight,
          color: ink(route, point[0]),
          depth: points[points.length - 1][2],
          width: route % 3 === 0 ? 1.5 : 1.05,
        });
      }
    }
    // Air is transparent, but its per-pixel visibility is still tested against all metal.
    traces.sort((a, b) => a.depth - b.depth);
    for (const trace of traces) {
      for (let i = 0; i < trace.points.length - 1; i++)
        r.line(
          trace.points[i],
          trace.points[i + 1],
          trace.color,
          trace.width,
          trace.alpha,
        );
      const tip = trace.points[trace.points.length - 1];
      r.line(
        tip,
        tip,
        trace.color,
        (1.1 + power.throttle * 0.65) * 2,
        trace.alpha * 0.7,
      );
    }
    ctx.putImageData(image, 0, 0);
    canvas.dataset.spool = spool.toFixed(2);
    canvas.dataset.phase = angle.toFixed(3);
    canvas.dataset.flow = power.flow.toFixed(3);
    canvas.dataset.reach = power.reach.toFixed(2);
    canvas.dataset.reverser = deployment.toFixed(3);
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
    deployment = approachReverser(deployment, reverseTarget, dt);
    const power = enginePower(spool);
    angle = (angle + dt * power.rotation) % (Math.PI * 2 * 5);
    clock += dt * power.flow;
    draw();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const box = canvas.getBoundingClientRect(),
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(box.width * ratio)),
      height = Math.max(1, Math.round(box.height * ratio));
    if (!image || canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      image = ctx!.createImageData(width, height);
      raster = new EngineRaster(width, height, staticTriangles, image.data);
    }
    draw();
  }
  const observer =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : undefined;
  observer?.observe(canvas);
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
    configure(speed: number, reduced: boolean, mode: ThrustMode = "forward") {
      target = speed;
      reverseTarget = mode === "reverse" ? 1 : 0;
      still = reduced;
      if (speed === 0) pause();
      if (reduced || !playing) {
        spool = target;
        deployment = reverseTarget;
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
      reverseTarget = deployment = 0;
      angle = clock = 0;
      draw();
    },
    dispose() {
      pause();
      observer?.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("contextlost", lost);
    },
  };
}
