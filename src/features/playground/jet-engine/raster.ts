import {
  DEPTH_EPSILON,
  planeDepth,
  triangle,
  type DepthPoint,
  type DepthTriangle,
} from "../../../domain/playground/engine-depth";

export type Ink = readonly [number, number, number];
export type EdgeMask = readonly [boolean, boolean, boolean];
export type InkSample = {
  index: number;
  depth: number;
  color: Ink;
  alpha: number;
};
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** A small fixed-camera z-buffer. No browser/GPU dependency in the visibility rules. */
export class EngineRaster {
  readonly depth: Float32Array;
  readonly staticDepth: Float32Array;
  readonly pixels: Uint8ClampedArray;
  readonly sx: number;
  readonly sy: number;
  constructor(
    readonly width: number,
    readonly height: number,
    staticTriangles: readonly DepthTriangle[],
    pixels?: Uint8ClampedArray,
  ) {
    this.sx = width / 1100;
    this.sy = height / 480;
    this.depth = new Float32Array(width * height);
    this.staticDepth = new Float32Array(width * height);
    this.staticDepth.fill(-Infinity);
    this.pixels = pixels || new Uint8ClampedArray(width * height * 4);
    for (const t of staticTriangles)
      this.scan(t, 0.35, (_x, _y, z, index) => {
        if (z > this.staticDepth[index]) this.staticDepth[index] = z;
      });
    this.begin();
  }
  begin() {
    this.depth.set(this.staticDepth);
    this.pixels.fill(0);
  }
  private blend(index: number, color: Ink, alpha: number) {
    if (alpha <= 0) return;
    const at = index * 4;
    if (alpha >= 0.999) {
      this.pixels[at] = color[0];
      this.pixels[at + 1] = color[1];
      this.pixels[at + 2] = color[2];
      this.pixels[at + 3] = 255;
      return;
    }
    const old = this.pixels[at + 3] / 255,
      total = alpha + old * (1 - alpha);
    for (let i = 0; i < 3; i++)
      this.pixels[at + i] =
        (color[i] * alpha + this.pixels[at + i] * old * (1 - alpha)) / total;
    this.pixels[at + 3] = total * 255;
  }
  private scaled(t: DepthTriangle) {
    const points = t.vertices.map(
      (p) => [p[0] * this.sx, p[1] * this.sy, p[2]] as DepthPoint,
    );
    return triangle([points[0], points[1], points[2]]);
  }
  private scan(
    source: DepthTriangle,
    padding: number,
    visit: (
      x: number,
      y: number,
      z: number,
      index: number,
      d0: number,
      d1: number,
      d2: number,
      l0: boolean,
      l1: boolean,
      l2: boolean,
    ) => void,
  ) {
    const t = this.scaled(source);
    if (!t) return;
    const [a, b, c] = t.vertices,
      v = [a, b, c];
    const edges = v.map((p, i) => {
      const q = v[(i + 1) % 3],
        dx = q[0] - p[0],
        dy = q[1] - p[1];
      return {
        a: -dy,
        b: dx,
        c: dy * p[0] - dx * p[1],
        length: Math.hypot(dx, dy),
        left: dy < 0 || (Math.abs(dy) < 1e-9 && dx > 0),
      };
    });
    const pad = padding * Math.max(this.sx, this.sy),
      left = Math.max(0, Math.floor(t.bounds[0] - pad)),
      right = Math.min(this.width - 1, Math.ceil(t.bounds[2] + pad)),
      top = Math.max(0, Math.floor(t.bounds[1] - pad)),
      bottom = Math.min(this.height - 1, Math.ceil(t.bounds[3] + pad));
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) {
        const px = x + 0.5,
          py = y + 0.5;
        const d0 =
          (edges[0].a * px + edges[0].b * py + edges[0].c) / edges[0].length;
        const d1 =
          (edges[1].a * px + edges[1].b * py + edges[1].c) / edges[1].length;
        const d2 =
          (edges[2].a * px + edges[2].b * py + edges[2].c) / edges[2].length;
        if (d0 < -pad || d1 < -pad || d2 < -pad) continue;
        let z = planeDepth(t, px, py);
        if (d0 < 0 || d1 < 0 || d2 < 0) {
          // Stroked/antialiased borders inherit their nearest surface edge,
          // never an extrapolated plane that could jump in front of the fan.
          let nearest = Infinity;
          for (let i = 0; i < 3; i++) {
            const a = v[i],
              b = v[(i + 1) % 3],
              dx = b[0] - a[0],
              dy = b[1] - a[1];
            const u = clamp(
              ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy),
            );
            const ex = px - a[0] - dx * u,
              ey = py - a[1] - dy * u,
              distance = ex * ex + ey * ey;
            if (distance < nearest) {
              nearest = distance;
              z = a[2] + (b[2] - a[2]) * u;
            }
          }
        }
        visit(
          px,
          py,
          z,
          y * this.width + x,
          d0,
          d1,
          d2,
          edges[0].left,
          edges[1].left,
          edges[2].left,
        );
      }
  }
  metal(t: DepthTriangle, color: Ink, boundaries: EdgeMask, edges = false) {
    this.scan(t, 0.75, (x, y, z, index, d0, d1, d2, l0, l1, l2) => {
      let coverage = 1;
      if (boundaries[0]) coverage = Math.min(coverage, clamp(d0 + 0.5));
      else if (d0 < 0 || (Math.abs(d0) < 1e-8 && !l0)) return;
      if (boundaries[1]) coverage = Math.min(coverage, clamp(d1 + 0.5));
      else if (d1 < 0 || (Math.abs(d1) < 1e-8 && !l1)) return;
      if (boundaries[2]) coverage = Math.min(coverage, clamp(d2 + 0.5));
      else if (d2 < 0 || (Math.abs(d2) < 1e-8 && !l2)) return;
      if (coverage <= 0 || z < this.depth[index] - DEPTH_EPSILON) return;
      if (edges && (d0 < 0 || d1 < 0 || d2 < 0)) {
        // Acute door/blade corners must not grow a long antialiased miter.
        let nearest = Infinity;
        for (let i = 0; i < 3; i++)
          if (boundaries[i]) {
            const a = t.vertices[i],
              b = t.vertices[(i + 1) % 3],
              ax = a[0] * this.sx,
              ay = a[1] * this.sy,
              dx = (b[0] - a[0]) * this.sx,
              dy = (b[1] - a[1]) * this.sy;
            const u = clamp(
              ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy),
            );
            nearest = Math.min(
              nearest,
              Math.hypot(x - ax - u * dx, y - ay - u * dy),
            );
          }
        coverage = Math.min(coverage, clamp(0.5 - nearest));
      }
      if (edges) {
        if (coverage < 0.999) this.blend(index, color, coverage);
      } else if (coverage >= 0.999) {
        this.depth[index] = z;
        this.blend(index, color, 1);
      }
    });
  }
  line(
    a: DepthPoint,
    b: DepthPoint,
    color: Ink,
    width: number,
    alpha: number,
    bias = 0,
    collect?: InkSample[],
  ) {
    const ax = a[0] * this.sx,
      ay = a[1] * this.sy,
      bx = b[0] * this.sx,
      by = b[1] * this.sy,
      dx = bx - ax,
      dy = by - ay,
      length = dx * dx + dy * dy;
    const radius = (width * (this.sx + this.sy)) / 4;
    const left = Math.max(0, Math.floor(Math.min(ax, bx) - radius - 1)),
      right = Math.min(
        this.width - 1,
        Math.ceil(Math.max(ax, bx) + radius + 1),
      ),
      top = Math.max(0, Math.floor(Math.min(ay, by) - radius - 1)),
      bottom = Math.min(
        this.height - 1,
        Math.ceil(Math.max(ay, by) + radius + 1),
      );
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) {
        const u = length
          ? clamp(((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / length)
          : 0;
        const ex = x + 0.5 - ax - dx * u,
          ey = y + 0.5 - ay - dy * u;
        const coverage = clamp(radius + 0.5 - Math.sqrt(ex * ex + ey * ey));
        if (!coverage) continue;
        const index = y * this.width + x,
          z = a[2] + (b[2] - a[2]) * u + bias;
        if (
          z >=
          (collect ? this.staticDepth : this.depth)[index] - DEPTH_EPSILON
        ) {
          if (collect)
            collect.push({ index, depth: z, color, alpha: alpha * coverage });
          else this.blend(index, color, alpha * coverage);
        }
      }
  }
  samples(samples: readonly InkSample[]) {
    for (const sample of samples)
      if (sample.depth >= this.depth[sample.index] - DEPTH_EPSILON)
        this.blend(sample.index, sample.color, sample.alpha);
  }
  volume(
    t: DepthTriangle,
    color: Ink,
    alphaAt: (x: number, y: number) => number,
  ) {
    this.scan(t, 0, (x, y, z, index, d0, d1, d2, l0, l1, l2) => {
      if (
        (Math.abs(d0) < 1e-8 && !l0) ||
        (Math.abs(d1) < 1e-8 && !l1) ||
        (Math.abs(d2) < 1e-8 && !l2) ||
        z < this.depth[index] - DEPTH_EPSILON
      )
        return;
      this.blend(index, color, alphaAt(x / this.sx, y / this.sy));
    });
  }
}
