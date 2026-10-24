import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  covers,
  DepthIndex,
  planeDepth,
  triangle,
  triangulate,
  visibleLine,
  visiblePolygons,
  type DepthPoint,
} from "../src/domain/playground/engine-depth";
import {
  EngineRaster,
  type InkSample,
} from "../src/features/playground/jet-engine/raster";
import {
  engineFaces,
  staticTriangles,
  projectDepth,
} from "../src/features/playground/jet-engine/mesh";
import geometry from "../src/features/playground/jet-engine/engine-depth.json";
import art from "../src/features/playground/jet-engine/engine-art.json";

test("the wing/engine assembly stays centered and within the fixed frame across deployment", () => {
  for (const d of [0, 0.25, 0.5, 0.75, 1]) {
    const points = [
      ...staticTriangles.flatMap((t) => t.vertices),
      ...engineFaces(0, d).flatMap((f) => f.vertices),
    ];
    const left = Math.min(...points.map((p) => p[0])),
      right = Math.max(...points.map((p) => p[0])),
      top = Math.min(...points.map((p) => p[1])),
      bottom = Math.max(...points.map((p) => p[1]));
    assert.ok(
      Math.abs((left + right) / 2 - 550) < 18,
      `horizontal centre at deployment ${d}`,
    );
    assert.ok(
      Math.abs((top + bottom) / 2 - 240) < 18,
      `vertical centre at deployment ${d}`,
    );
    assert.ok(left > 35 && right < 1065 && top > 35 && bottom < 445);
  }
});

test("wing-mounted engine has sealed core shoulders and no test-stand geometry", () => {
  const names = geometry.groups.map((group) => group.name);
  assert.ok(!names.some((name) => name.startsWith("stand.")));
  for (const prefix of [
    "wing.skin.",
    "pylon.fairing",
    "pylon.saddle.",
    "pylon.access.",
  ])
    assert.ok(names.some((name) => name.startsWith(prefix)));
  for (const [i, [start, end, radius]] of [
    [-12, -8, 35],
    [66, 70, 35],
    [112, 116, 30],
  ].entries()) {
    const joint = new DepthIndex(
      geometry.groups
        .filter((g) => g.name.startsWith(`core.joint.${i}.`))
        .flatMap((g) =>
          staticTriangles.slice(g.start / 3, (g.start + g.count) / 3),
        ),
    );
    for (let step = 0; step <= 20; step++) {
      // Stay off the independently rounded 0.1px cap rims; audit proves contact.
      const x = start + 0.15 + ((end - start - 0.3) * step) / 20;
      // Probe the true faceted wall, not an ideal circle just outside it.
      const startAngle =
        Math.PI * 1.5 + Math.atan2(art.camera.view[2], art.camera.view[1]);
      const count = Math.ceil((Math.PI * 2 - startAngle) / (Math.PI / 20)),
        stride = (Math.PI * 2 - startAngle) / count;
      const a = startAngle + Math.floor((5.8 - startAngle) / stride) * stride,
        b = a + stride;
      const p = projectDepth([
        x,
        (radius * (Math.cos(a) + Math.cos(b))) / 2,
        102 + (radius * (Math.sin(a) + Math.sin(b))) / 2,
      ]);
      assert.ok(
        Math.abs(joint.nearest(p[0], p[1]) - p[2]) < 0.6,
        `joint ${i} is open at x=${x}`,
      );
    }
  }
});

test("the SVG's actual individual paint sequence matches the measured geometry order", () => {
  assert.equal(geometry.triangles.length, staticTriangles.length * 3);
  for (const theme of ["light", "dark"]) {
    const source = readFileSync(
      `src/features/playground/jet-engine/engine-back-${theme}.svg`,
      "utf8",
    );
    const fills = [...source.matchAll(/class="iso-fill" d="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.equal(fills.length, geometry.groups.length);
    geometry.groups.forEach((group, index) => {
      const triangles = staticTriangles.slice(
        group.start / 3,
        (group.start + group.count) / 3,
      );
      const expected = [
        Math.min(...triangles.map((t) => t.bounds[0])),
        Math.min(...triangles.map((t) => t.bounds[1])),
        Math.max(...triangles.map((t) => t.bounds[2])),
        Math.max(...triangles.map((t) => t.bounds[3])),
      ];
      const numbers = (
        fills[index].match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []
      ).map(Number);
      const xs = numbers.filter((_, i) => i % 2 === 0),
        ys = numbers.filter((_, i) => i % 2 === 1);
      const actual = [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ];
      for (let axis = 0; axis < 4; axis++)
        assert.ok(
          Math.abs(actual[axis] - expected[axis]) < 0.25,
          `${theme}: wrong paint item at ${index} (${group.name})`,
        );
    });
  }
});

test("concave blade caps triangulate without filling their notches", () => {
  const cap: DepthPoint[] = [
    [0, 0, 1],
    [4, 0, 1],
    [4, 1, 1],
    [1, 1, 1],
    [1, 4, 1],
    [0, 4, 1],
  ];
  const triangles = triangulate(cap);
  const area = triangles.reduce((sum, t) => {
    const [a, b, c] = t.vertices;
    return (
      sum +
      Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) /
        2
    );
  }, 0);
  assert.equal(area, 7);
  assert.ok(!triangles.some((t) => covers(t, 2, 2)));
  for (const angle of [0, 0.3, 0.8, 1.4, 2.1])
    for (const face of engineFaces(angle)) {
      const polygonArea =
        Math.abs(
          face.vertices.reduce(
            (sum, p, i) =>
              sum +
              p[0] * face.vertices[(i + 1) % face.vertices.length][1] -
              face.vertices[(i + 1) % face.vertices.length][0] * p[1],
            0,
          ),
        ) / 2;
      const triangleArea = face.triangles.reduce((sum, t) => {
        const [a, b, c] = t.vertices;
        return (
          sum +
          Math.abs(
            (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
          ) /
            2
        );
      }, 0);
      assert.ok(Math.abs(polygonArea - triangleArea) < 0.00001);
    }
});

test("crossing depth planes render correctly in either draw order, unlike average-depth sorting", () => {
  const slope = triangle([
    [100, 100, 0],
    [300, 100, 10],
    [100, 300, 0],
  ])!;
  const flat = triangle([
    [100, 100, 4],
    [300, 100, 4],
    [100, 300, 4],
  ])!;
  for (const reverse of [false, true]) {
    const raster = new EngineRaster(1100, 480, []);
    const objects = [
      { t: slope, color: [220, 20, 20] as const },
      { t: flat, color: [20, 20, 220] as const },
    ];
    if (reverse) objects.reverse();
    for (const object of objects)
      raster.metal(object.t, object.color, [true, true, true]);
    const pixel = (x: number, y: number) => [
      ...raster.pixels.slice((y * 1100 + x) * 4, (y * 1100 + x) * 4 + 4),
    ];
    assert.deepEqual(pixel(250, 110), [220, 20, 20, 255]);
    assert.deepEqual(pixel(120, 110), [20, 20, 220, 255]);
  }
});

test("metal, air segments and hot-air volumes all respect the same static depth", () => {
  const cover = triangle([
    [100, 100, 5],
    [300, 100, 5],
    [100, 300, 5],
  ])!;
  const hidden = triangle([
    [100, 100, 1],
    [300, 100, 1],
    [100, 300, 1],
  ])!;
  const raster = new EngineRaster(1100, 480, [cover]);
  raster.metal(hidden, [220, 20, 20], [true, true, true]);
  raster.line([120, 120, 1], [160, 120, 1], [0, 150, 250], 3, 1);
  raster.volume(hidden, [250, 120, 20], () => 0.7);
  const at = (120 * 1100 + 140) * 4;
  assert.equal(
    raster.pixels[at + 3],
    0,
    "the underlying SVG must remain uncovered",
  );
  raster.line([120, 120, 8], [160, 120, 8], [0, 150, 250], 3, 1);
  assert.equal(raster.pixels[at + 3], 255, "foreground air stays visible");
  raster.begin();
  assert.equal(raster.pixels[at + 3], 0);
  assert.equal(raster.depth[120 * 1100 + 140], 5);
});

test("thin silhouette borders use edge depth instead of extrapolating steep planes", () => {
  const thin = triangle([
    [100, 100.3, 0],
    [300, 100.3, 0],
    [100, 100.4, 10],
  ])!;
  const raster = new EngineRaster(1100, 480, [thin]);
  const value = raster.staticDepth[100 * 1100 + 100];
  assert.ok(Number.isFinite(value) && value >= 0 && value <= 10);
});

test("acute reverser tips cannot paint an antialiasing miter beyond the physical corner", () => {
  const tip = triangle([
    [580.278, 258.54, 10],
    [586.795, 263.564, 20],
    [589.638, 267.72, 25],
  ])!;
  const raster = new EngineRaster(1100, 480, []);
  raster.metal(tip, [100, 120, 160], [true, true, false], true);
  assert.equal(raster.pixels[(257 * 1100 + 579) * 4 + 3], 0);
});

test("SVG fallback clips polygons and individual line intervals rather than assigning a whole front layer", () => {
  const cover = triangle([
    [0, 0, 4],
    [10, 0, 4],
    [0, 10, 4],
  ])!;
  const slope = triangle([
    [0, 0, 0],
    [10, 0, 10],
    [0, 10, 0],
  ])!;
  const index = new DepthIndex([cover]);
  const visible = visiblePolygons(slope, index).flatMap(triangulate);
  assert.ok(visible.some((t) => covers(t, 7, 1)));
  assert.ok(!visible.some((t) => covers(t, 1, 1)));
  const rectangle = new DepthIndex([
    triangle([
      [0, 0, 5],
      [10, 0, 5],
      [0, 10, 5],
    ])!,
    triangle([
      [10, 0, 5],
      [10, 10, 5],
      [0, 10, 5],
    ])!,
  ]);
  const segments = visibleLine([-5, 5, 1], [15, 5, 9], rectangle);
  assert.equal(segments.length, 2);
  assert.ok(Math.abs(segments[0][1][0]) < 0.01);
  assert.ok(Math.abs(segments[1][0][0] - 5) < 0.01);
});

test("cached guide coverage is retested against the current moving metal", () => {
  const raster = new EngineRaster(1100, 480, []),
    samples: InkSample[] = [];
  raster.line([120, 120, 3], [160, 120, 3], [0, 150, 250], 3, 1, 0, samples);
  const cover = triangle([
    [100, 100, 8],
    [300, 100, 8],
    [100, 300, 8],
  ])!;
  raster.metal(cover, [200, 30, 30], [true, true, true]);
  raster.samples(samples);
  const at = (120 * 1100 + 140) * 4;
  assert.deepEqual([...raster.pixels.slice(at, at + 4)], [200, 30, 30, 255]);
  raster.begin();
  raster.samples(samples);
  assert.deepEqual([...raster.pixels.slice(at, at + 4)], [0, 150, 250, 255]);
});

test("real engine poses reproduce both old layering errors and pass pixel/ray visibility checks", () => {
  const fixed = new DepthIndex(staticTriangles);
  const oldFront = new DepthIndex(
    geometry.groups
      .filter((g) => g.legacyLayer === "front")
      .flatMap((g) =>
        staticTriangles.slice(g.start / 3, (g.start + g.count) / 3),
      ),
  );
  let falseFront = 0,
    backLeaks = 0;
  // Fan and core blade patterns share a pi/9 period. Cover that entire period.
  const poses = [
    ...Array.from({ length: 16 }, (_, i) => ({
      angle: (i * Math.PI) / 144,
      deployment: 0,
    })),
    ...[0.25, 0.5, 0.75, 1].flatMap((deployment) =>
      [0, 0.15].map((angle) => ({ angle, deployment })),
    ),
  ];
  for (const { angle, deployment } of poses) {
    const faces = engineFaces(angle, deployment),
      moving = faces.flatMap((face) => face.triangles),
      index = new DepthIndex([...staticTriangles, ...moving]);
    const raster = new EngineRaster(1100, 480, staticTriangles);
    for (const face of faces)
      for (let i = 0; i < face.triangles.length; i++)
        raster.metal(face.triangles[i], [60, 100, 150], face.boundaries[i]);
    for (const face of faces)
      for (let i = 0; i < face.triangles.length; i++)
        raster.metal(
          face.triangles[i],
          [60, 100, 150],
          face.boundaries[i],
          true,
        );
    for (const t of moving) {
      const p: DepthPoint = [0, 1, 2].map(
        (axis) => t.vertices.reduce((sum, v) => sum + v[axis], 0) / 3,
      ) as [number, number, number];
      const s = fixed.nearest(p[0], p[1]),
        f = oldFront.nearest(p[0], p[1]),
        nearest = index.nearest(p[0], p[1]);
      if (
        p[2] > s + 1 &&
        f > -Infinity &&
        f < p[2] - 1 &&
        nearest < p[2] + 0.01
      )
        falseFront++;
      if (s > p[2] + 1 && f < s - 1 && Math.abs(nearest - s) < 0.01)
        backLeaks++;
    }
    let visible = 0,
      hidden = 0;
    const movingIndex = new DepthIndex(moving);
    const bounds = [
      Math.min(...moving.map((t) => t.bounds[0])),
      Math.min(...moving.map((t) => t.bounds[1])),
      Math.max(...moving.map((t) => t.bounds[2])),
      Math.max(...moving.map((t) => t.bounds[3])),
    ];
    for (let y = Math.ceil(bounds[1]); y < bounds[3]; y += 3)
      for (let x = Math.ceil(bounds[0]); x < bounds[2]; x += 3) {
        const px = x + 0.5,
          py = y + 0.5,
          d = movingIndex.nearest(px, py),
          s = fixed.nearest(px, py),
          at = y * 1100 + x;
        if (!Number.isFinite(d) || Math.abs(s - raster.staticDepth[at]) > 0.2)
          continue;
        // A pixel straddling a foreground edge legitimately has partial coverage
        // even when its centre ray hits a hidden face. Compare full interiors.
        const nearEdge = movingIndex
          .query([px - 0.7, py - 0.7, px + 0.7, py + 0.7])
          .some((t) =>
            t.vertices.some((a, i) => {
              const b = t.vertices[(i + 1) % 3],
                dx = b[0] - a[0],
                dy = b[1] - a[1],
                length = dx * dx + dy * dy;
              const u = Math.max(
                0,
                Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / length),
              );
              return Math.hypot(px - a[0] - u * dx, py - a[1] - u * dy) < 0.7;
            }),
          );
        if (nearEdge) continue;
        if (d > s + 0.3) {
          assert.ok(
            raster.pixels[at * 4 + 3] > 0,
            `angle ${angle}: missing foreground at ${x},${y}`,
          );
          visible++;
        } else if (d < s - 0.3) {
          assert.equal(
            raster.pixels[at * 4 + 3],
            0,
            `angle ${angle}: paint through casing/shaft at ${x},${y}`,
          );
          hidden++;
        }
      }
    assert.ok(visible > 30 && hidden > 30);
    // Test native SVG clipping against the same independently queried scene planes.
    for (const t of moving.filter((_, i) => i % 17 === 0))
      for (const polygon of visiblePolygons(t, index)) {
        if (polygon.length < 3) continue;
        const x = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length,
          y = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
        assert.ok(index.nearest(x, y) - planeDepth(t, x, y) < 0.003);
      }
  }
  assert.ok(
    falseFront > 10,
    "the old front SVG incorrectly covered near fan surfaces",
  );
  assert.ok(
    backLeaks > 40,
    "the old back SVG let moving parts paint through nearer metal",
  );
});
