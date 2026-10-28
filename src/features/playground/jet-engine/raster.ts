import {
  DEPTH_EPSILON,
  planeDepth,
  triangle,
  type DepthPoint,
  type DepthTriangle,
  type DepthTriangleBuffer,
} from "../../../domain/playground/engine-depth";

export type Ink = readonly [number, number, number];
type EdgeMask = readonly [boolean, boolean, boolean];
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
  private fringe = new Float64Array(0);
  private fringeCount = 0;
  private fringeColor: [number, number, number] = [0, 0, 0];
  private readonly projected: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  private readonly scanTriangle: DepthTriangleBuffer = {
    vertices: [this.projected[0], this.projected[1], this.projected[2]],
    bounds: [0, 0, 0, 0],
    plane: [0, 0, 0],
  };
  private readonly edges = Array.from({ length: 3 }, () => ({
    a: 0,
    b: 0,
    c: 0,
    length: 0,
    left: false,
  }));
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
    for (const t of staticTriangles) this.scan(t, 0.35);
    this.begin();
  }
  begin() {
    this.fringeCount = 0;
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
    for (let i = 0; i < 3; i++) {
      const point = t.vertices[i],
        out = this.projected[i];
      out[0] = point[0] * this.sx;
      out[1] = point[1] * this.sy;
      out[2] = point[2];
    }
    return triangle(this.projected, this.scanTriangle);
  }
  private scan(
    source: DepthTriangle,
    padding: number,
    color?: Ink,
    boundaries?: EdgeMask,
    alphaAt?: (x: number, y: number) => number,
  ) {
    const t = this.scaled(source);
    if (!t) return;
    const v = t.vertices,
      edges = this.edges;
    for (let i = 0; i < 3; i++) {
      const p = v[i];
      const q = v[(i + 1) % 3],
        dx = q[0] - p[0],
        dy = q[1] - p[1];
      const edge = edges[i];
      edge.a = -dy;
      edge.b = dx;
      edge.c = dy * p[0] - dx * p[1];
      edge.length = Math.hypot(dx, dy);
      edge.left = dy < 0 || (Math.abs(dy) < 1e-9 && dx > 0);
    }
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
        const index = y * this.width + x;
        if (!color) {
          if (z > this.staticDepth[index]) this.staticDepth[index] = z;
          continue;
        }
        if (!boundaries) {
          if (z < this.depth[index] - DEPTH_EPSILON) continue;
          if (
            (Math.abs(d0) < 1e-8 && !edges[0].left) ||
            (Math.abs(d1) < 1e-8 && !edges[1].left) ||
            (Math.abs(d2) < 1e-8 && !edges[2].left)
          )
            continue;
          this.blend(index, color, alphaAt!(px / this.sx, py / this.sy));
          continue;
        }
        let coverage = 1;
        if (boundaries[0]) coverage = Math.min(coverage, clamp(d0 + 0.5));
        else if (d0 < 0 || (Math.abs(d0) < 1e-8 && !edges[0].left)) continue;
        if (boundaries[1]) coverage = Math.min(coverage, clamp(d1 + 0.5));
        else if (d1 < 0 || (Math.abs(d1) < 1e-8 && !edges[1].left)) continue;
        if (boundaries[2]) coverage = Math.min(coverage, clamp(d2 + 0.5));
        else if (d2 < 0 || (Math.abs(d2) < 1e-8 && !edges[2].left)) continue;
        if (coverage <= 0) continue;
        if (d0 < 0 || d1 < 0 || d2 < 0) {
          // Acute corners inherit the same nearest-edge coverage as before.
          let nearest = Infinity;
          for (let i = 0; i < 3; i++)
            if (boundaries[i]) {
              const a = source.vertices[i],
                b = source.vertices[(i + 1) % 3],
                ax = a[0] * this.sx,
                ay = a[1] * this.sy,
                dx = (b[0] - a[0]) * this.sx,
                dy = (b[1] - a[1]) * this.sy;
              const u = clamp(
                ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy),
              );
              nearest = Math.min(
                nearest,
                Math.hypot(px - ax - u * dx, py - ay - u * dy),
              );
            }
          coverage = Math.min(coverage, clamp(0.5 - nearest));
        }
        if (coverage >= 0.999) {
          if (z < this.depth[index] - DEPTH_EPSILON) continue;
          this.depth[index] = z;
          this.blend(index, color, 1);
        } else if (coverage > 0) {
          // Epsilon-tied opaque samples may lower depth slightly later. Do not
          // reject fringes until the complete opaque pass has finished.
          this.queueFringe(index, z, color, coverage);
        }
      }
  }
  metal(t: DepthTriangle, color: Ink, boundaries: EdgeMask) {
    this.scan(t, 0.75, color, boundaries);
  }
  private queueFringe(index: number, depth: number, color: Ink, alpha: number) {
    if (this.fringeCount + 6 > this.fringe.length) {
      const grown = new Float64Array(Math.max(24576, this.fringe.length * 2));
      grown.set(this.fringe);
      this.fringe = grown;
    }
    const at = this.fringeCount;
    this.fringe[at] = index;
    this.fringe[at + 1] = depth;
    this.fringe[at + 2] = color[0];
    this.fringe[at + 3] = color[1];
    this.fringe[at + 4] = color[2];
    this.fringe[at + 5] = alpha;
    this.fringeCount += 6;
  }
  /** Resolve only queued edge pixels after all opaque surfaces establish depth. */
  finishMetal() {
    for (let at = 0; at < this.fringeCount; at += 6) {
      const index = this.fringe[at];
      if (this.fringe[at + 1] < this.depth[index] - DEPTH_EPSILON) continue;
      this.fringeColor[0] = this.fringe[at + 2];
      this.fringeColor[1] = this.fringe[at + 3];
      this.fringeColor[2] = this.fringe[at + 4];
      this.blend(index, this.fringeColor, this.fringe[at + 5]);
    }
    this.fringeCount = 0;
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
    const reach = radius + 0.5;
    for (let y = top; y <= bottom; y++) {
      // Restrict the capsule's bounding box to this row. Do not change its
      // coverage/depth formula or approximate moving airflow geometry.
      const u0 = dy ? clamp((y + 0.5 - reach - ay) / dy) : 0;
      const u1 = dy ? clamp((y + 0.5 + reach - ay) / dy) : 1;
      const x0 = ax + dx * u0,
        x1 = ax + dx * u1;
      const rowLeft = Math.max(left, Math.floor(Math.min(x0, x1) - reach));
      const rowRight = Math.min(right, Math.ceil(Math.max(x0, x1) + reach));
      for (let x = rowLeft; x <= rowRight; x++) {
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
    this.scan(t, 0, color, undefined, alphaAt);
  }
}
