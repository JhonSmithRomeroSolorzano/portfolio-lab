import assert from "node:assert/strict";
import test from "node:test";
import {
  DEPTH_EPSILON,
  type DepthPoint,
} from "../src/domain/playground/engine-depth";
import {
  EngineRaster,
  type InkSample,
} from "../src/features/playground/jet-engine/raster";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** Deliberately slow full-image reference: no row or rectangle optimization. */
function reference(
  r: EngineRaster,
  a: DepthPoint,
  b: DepthPoint,
  width: number,
  alpha: number,
  bias: number,
) {
  const ax = a[0] * r.sx,
    ay = a[1] * r.sy,
    dx = b[0] * r.sx - ax,
    dy = b[1] * r.sy - ay;
  const length = dx * dx + dy * dy,
    radius = (width * (r.sx + r.sy)) / 4,
    samples: InkSample[] = [];
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) {
      const u = length
        ? clamp(((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / length)
        : 0;
      const ex = x + 0.5 - ax - dx * u,
        ey = y + 0.5 - ay - dy * u;
      const coverage = clamp(radius + 0.5 - Math.sqrt(ex * ex + ey * ey));
      const index = y * r.width + x,
        z = a[2] + (b[2] - a[2]) * u + bias;
      if (coverage && z >= r.staticDepth[index] - DEPTH_EPSILON)
        samples.push({
          index,
          depth: z,
          color: [36, 122, 185],
          alpha: alpha * coverage,
        });
    }
  return samples;
}
test("row-bounded line sampling exactly matches full-image capsules and moving-depth composition", () => {
  let seed = 12345;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const [width, height] of [
    [110, 48],
    [220, 96],
    [137, 75],
  ]) {
    const r = new EngineRaster(width, height, []),
      expected = new EngineRaster(width, height, []);
    for (let i = 0; i < r.depth.length; i++) {
      r.staticDepth[i] = expected.staticDepth[i] = (i % 11) - 5;
      r.depth[i] = expected.depth[i] = Math.max(r.staticDepth[i], (i % 7) - 3);
    }
    for (let i = 0; i < 180; i++) {
      const a: DepthPoint = [
        random() * 1500 - 200,
        random() * 700 - 100,
        random() * 12 - 6,
      ];
      const b: DepthPoint =
        i % 6 === 0
          ? a
          : [
              i % 6 === 1 ? a[0] : random() * 1500 - 200,
              i % 6 === 2 ? a[1] : random() * 700 - 100,
              random() * 12 - 6,
            ];
      const lineWidth = [0, 0.55, 0.7, 1.05, 1.5, 3.5, 25][i % 7],
        alpha = [0.03, 0.45, 1][i % 3],
        bias = i % 2 ? 0.008 : 0;
      const samples = reference(r, a, b, lineWidth, alpha, bias),
        collected: InkSample[] = [];
      r.line(a, b, [36, 122, 185], lineWidth, alpha, bias, collected);
      assert.deepEqual(
        collected,
        samples,
        `samples ${width}x${height} case ${i}`,
      );
      r.line(a, b, [36, 122, 185], lineWidth, alpha, bias);
      expected.samples(samples);
      assert.deepEqual(
        r.pixels,
        expected.pixels,
        `composition ${width}x${height} case ${i}`,
      );
    }
  }
});
