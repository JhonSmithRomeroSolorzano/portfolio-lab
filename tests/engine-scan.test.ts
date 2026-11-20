import assert from "node:assert/strict";
import test from "node:test";
import {
  triangle,
  type DepthPoint,
  type DepthTriangle,
} from "../src/domain/playground/engine-depth";
import {
  EngineRaster,
  type Ink,
} from "../src/features/playground/jet-engine/raster";
import { engineFaces } from "../src/features/playground/jet-engine/mesh";
import { ReferenceScan } from "./helpers/engine-scan-reference";

const ink: Ink = [90, 130, 180];
const alpha = (x: number, y: number) =>
  0.1 + Math.abs(Math.sin(x / 1100 + y / 480)) * 0.4;
function compare(
  triangles: readonly DepthTriangle[],
  width: number,
  height: number,
) {
  const actual = new EngineRaster(width, height, triangles);
  const expected = new ReferenceScan(width, height, triangles);
  assert.deepEqual(
    actual.staticDepth,
    expected.staticDepth,
    "static padded depth",
  );
  const staticDepth = actual.staticDepth.slice();
  const masks = Array.from(
    { length: 8 },
    (_, bits) => [!!(bits & 1), !!(bits & 2), !!(bits & 4)] as const,
  );
  for (let pass = 0; pass < 2; pass++) {
    actual.staticDepth.set(
      pass ? staticDepth : new Float32Array(width * height).fill(-Infinity),
    );
    expected.staticDepth.set(actual.staticDepth);
    actual.begin();
    expected.begin();
    for (let i = 0; i < triangles.length; i++) {
      const t = triangles[pass ? triangles.length - 1 - i : i];
      const color: Ink = [ink[0] + (i % 60), ink[1], ink[2] - (i % 60)];
      actual.metal(t, color, masks[i % masks.length]);
      expected.metal(t, color, masks[i % masks.length]);
    }
    actual.finishMetal();
    expected.finishMetal();
    assert.deepEqual(
      actual.depth,
      expected.depth,
      "opaque depth and submission order",
    );
    assert.deepEqual(
      actual.pixels,
      expected.pixels,
      "metal and resolved fringe pixels",
    );
    for (const t of triangles) {
      actual.volume(t, ink, alpha);
      expected.volume(t, ink, alpha);
    }
    assert.deepEqual(
      actual.pixels,
      expected.pixels,
      "transparent volume pixels",
    );
  }
}

test("triangle scans match the rectangle reference for seeded, clipped and narrow geometry", () => {
  let seed = 0x6a09e667;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const triangles: DepthTriangle[] = [];
  const add = (a: DepthPoint, b: DepthPoint, c: DepthPoint) => {
    for (const points of [
      [a, b, c],
      [a, c, b],
    ] as const) {
      const t = triangle(points);
      if (t) triangles.push(t);
    }
  };
  for (let i = 0; i < 80; i++) {
    const point = (): DepthPoint => [
      random() * 1540 - 220,
      random() * 672 - 96,
      random() * 10,
    ];
    add(point(), point(), point());
  }
  for (const epsilon of [0, 1e-10, -1e-10, 0.001, -0.001]) {
    add([0, 0, 1], [1100, epsilon, 2], [550, 480, 3]);
    add([550, 0, 3], [550 + epsilon, 480, 2], [550.1, 240, 1]);
    add([-100, -100, 0], [1200, 500, 4], [1200, 500.01 + epsilon, 5]);
    add(
      [550.5 + epsilon, 240.5, 5],
      [570.5, 260.5, 5.001],
      [530.5, 260.5, 5.002],
    );
  }
  // Cancellation-sensitive crossing estimates must still respect the exact
  // signed-distance rejection, even far outside normal authored coordinates.
  add([-1e12, 240.5, 0], [1e12, 240.501, 1], [550, 240.5006, 2]);
  add([-1e12, -1e12, 0], [1e12, 1e12 + 0.25, 1], [550, 0, 2]);
  for (const [width, height] of [
    [110, 48],
    [231, 101],
    [330, 96],
  ] as const)
    compare(triangles, width, height);
  for (const [width, height] of [
    [550, 240],
    [1100, 480],
  ] as const)
    compare(
      triangles.filter((_, i) => i % 8 === 0),
      width,
      height,
    );
});

test("triangle scans preserve actual rotor and reverser face composition", () => {
  for (const [angle, deployment] of [
    [0, 0],
    [0.7, 0.5],
    [1.3, 1],
  ] as const) {
    const triangles = engineFaces(angle, deployment).flatMap(
      (face) => face.triangles,
    );
    compare(triangles, 275, 120);
  }
});
