import { test } from "node:test";
import assert from "node:assert/strict";
import {
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
