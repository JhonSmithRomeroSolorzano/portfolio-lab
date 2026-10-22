import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approachSculptureView,
  projectSculpturePoint,
  morphPoint,
  sculptureForms,
  sculpturePoints,
} from "../src/domain/playground/signal-sculpture.ts";

test("sculpture geometry is deterministic, bounded, and distinct at both quality levels", () => {
  for (const count of [720, 1800]) {
    const forms = sculptureForms.map((form) => sculpturePoints(form, count));
    forms.forEach((points, i) => {
      assert.equal(points.length, count);
      assert.deepEqual(points, sculpturePoints(sculptureForms[i], count));
      for (const p of points)
        for (const value of Object.values(p))
          assert.ok(Number.isFinite(value) && Math.abs(value) < 1);
    });
    assert.notDeepEqual(forms[0], forms[1]);
    assert.notDeepEqual(forms[1], forms[2]);
  }
  for (const count of [0, 2401, 1.5, NaN])
    assert.throws(() => sculpturePoints("monogram", count));
});

test("morphing preserves endpoints and stays finite through every transition", () => {
  const from = sculpturePoints("monogram", 720);
  const to = sculpturePoints("ribbon", 720);
  from.forEach((p, i) => {
    assert.deepEqual(morphPoint(p, to[i], -1, i), p);
    const end = morphPoint(p, to[i], 2, i);
    for (const axis of ["x", "y", "z"] as const)
      assert.ok(Math.abs(end[axis] - to[i][axis]) < 1e-12);
    for (const t of [0.1, 0.5, 0.9])
      for (const value of Object.values(morphPoint(p, to[i], t, i)))
        assert.ok(Number.isFinite(value) && Math.abs(value) < 1.3);
  });
});

test("the view follows the pointer consistently across forms and rotation angles", () => {
  for (const form of sculptureForms) {
    const points = sculpturePoints(form, 720);
    for (const spin of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      for (const axis of ["x", "y"] as const) {
        for (const direction of [-1, 1]) {
          const view = { x: 0, y: 0, [axis]: direction * 0.5 };
          const meanShift =
            points.reduce((sum, point) => {
              const neutral = projectSculpturePoint(point, spin, {
                x: 0,
                y: 0,
              });
              const moved = projectSculpturePoint(point, spin, view);
              for (const value of Object.values(moved))
                assert.ok(Number.isFinite(value) && Math.abs(value) < 1.5);
              return sum + moved[axis] - neutral[axis];
            }, 0) / points.length;
          // Readable, bounded movement toward the cursor, even face-on or edge-on.
          assert.ok(
            meanShift * direction > 0.04 && meanShift * direction < 0.09,
            `${form} at ${spin}: ${axis} shift ${meanShift}`,
          );
        }
      }
    }
  }
});

test("pointer easing is gradual, frame-rate independent, bounded and reversible", () => {
  const center = { x: 0, y: 0 };
  const target = { x: 0.5, y: -0.5 };
  assert.deepEqual(approachSculptureView(center, target, 0), center);
  const first = approachSculptureView(center, target, 1 / 60);
  assert.ok(first.x > 0 && first.x < target.x / 4);
  const run = (fps: number) => {
    let view = center;
    for (let i = 0; i < fps / 2; i++)
      view = approachSculptureView(view, target, 1 / fps);
    return view;
  };
  const normal = run(60),
    fast = run(120);
  assert.ok(Math.abs(normal.x - fast.x) < 1e-12);
  assert.ok(normal.x > 0.48 && normal.x < 0.5);
  const returning = approachSculptureView(normal, center, 1 / 60);
  assert.ok(returning.x > 0 && returning.x < normal.x);
  const settled = approachSculptureView(returning, center, 1);
  assert.ok(Math.abs(settled.x) < 0.001 && Math.abs(settled.y) < 0.001);
  const bounded = approachSculptureView(center, { x: 100, y: -100 }, 1);
  assert.ok(bounded.x <= 0.5 && bounded.y >= -0.5);
});
