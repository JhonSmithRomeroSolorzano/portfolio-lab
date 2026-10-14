import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addLoomAttractor,
  defaultAttractors,
  loomPreview,
  seedLoom,
  stepLoom,
} from "../src/domain/playground/gravity-loom.ts";

test("loom seeding and previews are deterministic and different flows weave different trails", () => {
  assert.deepEqual(seedLoom(48), seedLoom(48));
  const orbit = loomPreview(defaultAttractors, "orbit", 1, 48);
  assert.deepEqual(orbit, loomPreview(defaultAttractors, "orbit", 1, 48));
  assert.notDeepEqual(orbit, loomPreview(defaultAttractors, "weave", 1, 48));
  assert.equal(orbit.length, 48);
  assert.equal(orbit[0].length, 61);
  for (const count of [0, 121, 1.5, NaN]) assert.throws(() => seedLoom(count));
});

test("long loom runs remain finite, bounded, and independent of input mutation", () => {
  for (const flow of ["orbit", "weave"] as const)
    for (const strength of [0.5, 1.5])
      for (const attractors of [
        [],
        defaultAttractors,
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0.8, y: 0.8 },
          { x: -0.8, y: -0.8 },
        ],
      ]) {
        const seeded = seedLoom(48);
        let particles = seeded;
        for (let i = 0; i < 1200; i++)
          particles = stepLoom(particles, attractors, flow, strength);
        assert.deepEqual(seeded, seedLoom(48));
        for (const p of particles) {
          for (const v of Object.values(p)) assert.ok(Number.isFinite(v));
          assert.ok(Math.abs(p.x) <= 0.94 && Math.abs(p.y) <= 0.94);
          assert.ok(Math.hypot(p.vx, p.vy) <= 1.2 + 1e-10);
        }
      }
});

test("attractors clamp to the field, respect the four-point cap, and reject invalid forces", () => {
  const added = addLoomAttractor(defaultAttractors, { x: 5, y: -5 });
  assert.deepEqual(added[2], { x: 0.8, y: -0.8 });
  assert.equal(defaultAttractors.length, 2);
  const full = addLoomAttractor(added, { x: 0, y: 0 });
  assert.deepEqual(addLoomAttractor(full, { x: 0, y: 0 }), full);
  assert.throws(() => addLoomAttractor([], { x: NaN, y: 0 }));
  for (const strength of [0, 2, NaN])
    assert.throws(() => stepLoom(seedLoom(1), [], "orbit", strength));
  assert.throws(() =>
    stepLoom(seedLoom(1), [{ x: Infinity, y: 0 }], "orbit", 1),
  );
});
