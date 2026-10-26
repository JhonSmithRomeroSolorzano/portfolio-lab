import assert from "node:assert/strict";
import test from "node:test";
import {
  airPoint,
  writeAirPoint,
  enginePower,
  flowOpacity,
  type EnginePoint,
  type ThrustMode,
} from "../src/domain/playground/jet-engine";
import { createTracerPool } from "../src/features/playground/jet-engine/tracers";
import art from "../src/features/playground/jet-engine/engine-art.json";
import type { Ink } from "../src/features/playground/jet-engine/raster";
import { referenceAirPoint } from "./helpers/engine-air-reference";

test("caller-owned air points preserve the original allocating model at flow boundaries", () => {
  const buffer: [number, number, number] = [0, 0, 0];
  for (const speed of [0, 1, 35, 60, 100])
    for (const mode of ["forward", "reverse"] as const)
      for (let route = 0; route < 36; route++)
        for (const u of [
          0, 0.01, 0.2, 0.619999, 0.62, 0.620001, 0.779999, 0.78, 0.780001, 1,
        ]) {
          const point = airPoint(route, u, enginePower(speed), mode);
          assert.equal(
            writeAirPoint(buffer, route, u, enginePower(speed), mode),
            buffer,
          );
          assert.deepEqual(buffer, point);
          assert.deepEqual(
            point,
            referenceAirPoint(route, u, enginePower(speed), mode),
          );
        }
});

function reference(
  routes: number,
  speed: number,
  clock: number,
  still: boolean,
  reverseWeight: number,
  cool: Ink,
  hot: Ink,
) {
  const power = enginePower(speed);
  const project = (p: EnginePoint) => [
    art.origin[0] + p.reduce((s, v, i) => s + v * art.axes[i][0], 0),
    art.origin[1] + p.reduce((s, v, i) => s + v * art.axes[i][1], 0),
    p.reduce((s, v, i) => s + v * art.camera.view[i], 0),
  ];
  const streams = Array.from({ length: routes }, (_, route) =>
    route % 3 === 0
      ? [{ route, mode: "forward" as ThrustMode, weight: 1 }]
      : [
          { route, mode: "forward" as ThrustMode, weight: 1 - reverseWeight },
          { route, mode: "reverse" as ThrustMode, weight: reverseWeight },
        ],
  )
    .flat()
    .filter((s) => s.weight > 0.001);
  const traces = [];
  for (const { route, mode, weight } of streams)
    for (let slot = 0; slot < 22; slot++) {
      const density = Math.max(0, Math.min(1, power.density - slot));
      if (!density) continue;
      const u = (((slot / 22 + route * 0.037 + clock * 0.085) % 1) + 1) % 1,
        point = airPoint(route, u, power, mode),
        trail = (0.008 + power.throttle * 0.025) * (still ? 0.7 : 1);
      const points = Array.from({ length: 3 }, (_, i) =>
        project(
          airPoint(route, Math.max(0, u - trail * (1 - i / 2)), power, mode),
        ),
      );
      const heat =
        route % 3 === 0 ? Math.max(0, Math.min(1, (point[0] + 8) / 32)) : 0;
      traces.push({
        points,
        alpha:
          density * flowOpacity(u) * (0.38 + power.throttle * 0.38) * weight,
        color:
          heat === 0
            ? cool
            : heat === 1
              ? hot
              : cool.map((v, i) => Math.round(v + (hot[i] - v) * heat)),
        depth: points[2][2],
        width: route % 3 === 0 ? 1.5 : 1.05,
      });
    }
  return traces.sort((a, b) => a.depth - b.depth);
}
test("bounded tracer reuse preserves every point, color, opacity and transparent sort order", () => {
  for (const routes of [18, 36]) {
    const pool = createTracerPool(routes),
      cool: Ink = [36, 122, 185],
      hot: Ink = [195, 91, 32];
    const initial = [
      ...pool.sample(enginePower(100), 1, false, 0.5, cool, hot),
    ];
    const buffers = initial.map((t) => ({
      trace: t,
      points: t.points,
      color: t.color,
    }));
    const capacity = pool.capacity;
    for (const speed of [0, 1, 35, 60, 100])
      for (const reverse of [0, 0.0005, 0.5, 0.9995, 1])
        for (const still of [false, true]) {
          const clock = reverse * 17 + speed * 0.1;
          assert.deepEqual(
            pool.sample(enginePower(speed), clock, still, reverse, cool, hot),
            reference(routes, speed, clock, still, reverse, cool, hot),
          );
          assert.equal(pool.capacity, capacity);
        }
    const alternateCool: Ink = [40, 155, 210],
      alternateHot: Ink = [230, 130, 55];
    assert.deepEqual(
      pool.sample(enginePower(60), 3, false, 0.5, alternateCool, alternateHot),
      reference(routes, 60, 3, false, 0.5, alternateCool, alternateHot),
    );
    for (const { trace, points, color } of buffers) {
      assert.equal(trace.points, points);
      assert.equal(trace.color, color);
    }
    assert.ok(capacity <= routes * 44);
  }
  for (const routes of [0, -1, 37, NaN, 1.5])
    assert.throws(() => createTracerPool(routes), RangeError);
});
