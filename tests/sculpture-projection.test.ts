import assert from "node:assert/strict";
import test from "node:test";
import {
  morphPoint,
  projectSculpturePoint,
  sculptureForms,
  sculpturePoints,
  type SculpturePoint,
} from "../src/domain/playground/signal-sculpture";
import { createSculptureProjection } from "../src/features/playground/signal-sculpture/projection";
import { referenceSculpturePoint } from "./helpers/sculpture-projection-reference";

test("pooled Sculpture projection exactly preserves original coordinates, stable sort, and identities", () => {
  for (const count of [1, 720, 1800, 2400]) {
    const pool = createSculptureProjection(count);
    let order: unknown;
    const identities = new Map<number, unknown>();
    for (const form of sculptureForms)
      for (const progress of [0, 0.4, 1])
        for (const pose of [0, 1, 2]) {
          const from = sculpturePoints("monogram", count),
            to = sculpturePoints(form, count);
          const points = to.map((p, i) => morphPoint(from[i], p, progress, i)),
            copy = structuredClone(points);
          const width = [322, 540, 1200][pose],
            height = [322, 337, 480][pose],
            spin = [0, -0.7, Math.PI][pose],
            pulse = [0, 0.3, 10][pose],
            view = { x: [-0.5, 0, 0.5][pose], y: [0.5, 0, -0.5][pose] },
            scale = Math.min(width * 0.46, height * 0.73);
          const expected = points
            .map((point, i) => {
              const wave =
                Math.exp(
                  -Math.pow(
                    (Math.hypot(point.x, point.y) - pulse * 0.65) * 9,
                    2,
                  ),
                ) * 0.12;
              const displaced = { ...point, z: point.z + wave },
                out = { x: 0, y: 0, depth: 0 },
                p = referenceSculpturePoint(displaced, spin, view);
              assert.deepEqual(projectSculpturePoint(displaced, spin, view), p);
              assert.equal(
                projectSculpturePoint(displaced, spin, view, out),
                out,
              );
              assert.deepEqual(out, p);
              return {
                x: width / 2 + p.x * scale,
                y: height / 2 + p.y * scale,
                depth: p.depth,
                i,
              };
            })
            .sort((a, b) => a.depth - b.depth);
          const actual = pool.sample(points, width, height, spin, view, pulse);
          assert.deepEqual(actual, expected);
          assert.deepEqual(points, copy);
          if (order) assert.equal(actual, order);
          order = actual;
          for (const p of actual) {
            if (identities.has(p.i)) assert.equal(p, identities.get(p.i));
            else identities.set(p.i, p);
          }
        }
    // Equal-depth records must follow input order, not a previous frame's sort.
    const ties: SculpturePoint[] = Array.from({ length: count }, () => ({
      x: 0,
      y: 0,
      z: 0,
    }));
    assert.deepEqual(
      pool.sample(ties, 322, 322, 0, { x: 0, y: 0 }, 10).map((p) => p.i),
      Array.from({ length: count }, (_, i) => i),
    );
    assert.throws(
      () => pool.sample([], 322, 322, 0, { x: 0, y: 0 }, 10),
      RangeError,
    );
  }
  for (const count of [0, 2401, 1.5, NaN])
    assert.throws(() => createSculptureProjection(count), RangeError);
  const point = { x: 1, y: 2, z: 0 };
  assert.notEqual(
    projectSculpturePoint(point, 0, { x: 0, y: 0 }),
    projectSculpturePoint(point, 0, { x: 0, y: 0 }),
  );
});
