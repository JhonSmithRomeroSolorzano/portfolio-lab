import {
  DEPTH_EPSILON,
  planeDepth,
  triangle,
  type DepthPoint,
  type DepthTriangle,
} from "../../src/domain/playground/engine-depth";
import type { Ink } from "../../src/features/playground/jet-engine/raster";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
type Boundaries = readonly [boolean, boolean, boolean];

/** Frozen rectangle-scan equations, intentionally independent of row clipping. */
export class ReferenceScan {
  readonly staticDepth: Float32Array;
  readonly depth: Float32Array;
  readonly pixels: Uint8ClampedArray;
  private readonly sx: number;
  private readonly sy: number;
  private fringes: Array<{
    index: number;
    z: number;
    color: Ink;
    alpha: number;
  }> = [];

  constructor(
    readonly width: number,
    readonly height: number,
    triangles: readonly DepthTriangle[],
  ) {
    this.sx = width / 1100;
    this.sy = height / 480;
    this.staticDepth = new Float32Array(width * height);
    this.staticDepth.fill(-Infinity);
    this.depth = new Float32Array(width * height);
    this.pixels = new Uint8ClampedArray(width * height * 4);
    for (const t of triangles) this.scan(t, 0.35);
    this.begin();
  }
  begin() {
    this.fringes = [];
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
  private scan(
    source: DepthTriangle,
    padding: number,
    color?: Ink,
    boundaries?: Boundaries,
    alphaAt?: (x: number, y: number) => number,
  ) {
    const points = source.vertices.map(
      (p) => [p[0] * this.sx, p[1] * this.sy, p[2]] as DepthPoint,
    );
    const t = triangle([points[0], points[1], points[2]]);
    if (!t) return;
    const v = t.vertices;
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
        } else if (coverage > 0)
          this.fringes.push({ index, z, color, alpha: coverage });
      }
  }
  metal(t: DepthTriangle, color: Ink, boundaries: Boundaries) {
    this.scan(t, 0.75, color, boundaries);
  }
  volume(
    t: DepthTriangle,
    color: Ink,
    alphaAt: (x: number, y: number) => number,
  ) {
    this.scan(t, 0, color, undefined, alphaAt);
  }
  finishMetal() {
    for (const f of this.fringes)
      if (!(f.z < this.depth[f.index] - DEPTH_EPSILON))
        this.blend(f.index, f.color, f.alpha);
    this.fringes = [];
  }
}
