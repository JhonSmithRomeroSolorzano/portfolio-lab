import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addLoomAttractor,
  defaultAttractors,
  loomPreview,
  seedLoom,
  stepLoom,
  moveLoomAttractor,
  createLoomScene,
} from "../src/domain/playground/gravity-loom.ts";
import {
  loomViewport,
  projectLoomPoint,
  unprojectLoomPoint,
} from "../src/features/playground/gravity-loom/viewport.ts";

test("loom seeding and previews are deterministic and different flows weave different trails", () => {
  assert.deepEqual(seedLoom(48), seedLoom(48));
  const orbit = loomPreview(defaultAttractors, "orbit", 1, 48);
  assert.deepEqual(orbit, loomPreview(defaultAttractors, "orbit", 1, 48));
  assert.notDeepEqual(orbit, loomPreview(defaultAttractors, "weave", 1, 48));
  assert.equal(orbit.length, 48);
  assert.equal(orbit[0].length, 61);
  for (const count of [0, 121, 1.5, NaN]) assert.throws(() => seedLoom(count));
});

test("moving a point preserves its identity, count and other points, and clamps safely", () => {
  const moved = moveLoomAttractor(defaultAttractors, 0, { x: 4, y: -4 });
  assert.equal(moved.length, 2);
  assert.deepEqual(moved[0], { x: 1, y: -1 });
  assert.deepEqual(moved[1], defaultAttractors[1]);
  assert.equal(defaultAttractors[0].x, -0.36);
  assert.deepEqual(
    moveLoomAttractor(defaultAttractors, 9, { x: 0, y: 0 }),
    defaultAttractors,
  );
  assert.throws(() =>
    moveLoomAttractor(defaultAttractors, 0, { x: NaN, y: 0 }),
  );
});

test("preview endpoints and velocities form a continuous live scene; held points pull harder", () => {
  const scene = createLoomScene(defaultAttractors, "orbit", 1, 48);
  scene.particles.forEach((p, i) =>
    assert.deepEqual(scene.trails[i].at(-1), { x: p.x, y: p.y }),
  );
  const particles = [{ x: 0, y: 0, vx: 0, vy: 0 }];
  const points = [{ x: 0.4, y: 0 }];
  const normal = stepLoom(particles, points, "orbit", 1)[0];
  const held = stepLoom(particles, points, "orbit", 1, 0)[0];
  assert.ok(held.vx > normal.vx * 5);
  let current = seedLoom(48);
  for (let i = 0; i < 1200; i++) {
    const moving = [{ x: Math.sin(i / 30), y: Math.cos(i / 20) }];
    current = stepLoom(current, moving, "weave", 1.5, 0);
    for (const p of current) {
      assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1);
      assert.ok(Math.hypot(p.vx, p.vy) <= 1.2 + 1e-10);
    }
  }
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
          { x: 1, y: 1 },
          { x: -1, y: -1 },
        ],
      ]) {
        const seeded = seedLoom(48);
        let particles = seeded;
        for (let i = 0; i < 1200; i++)
          particles = stepLoom(particles, attractors, flow, strength);
        assert.deepEqual(seeded, seedLoom(48));
        for (const p of particles) {
          for (const v of Object.values(p)) assert.ok(Number.isFinite(v));
          assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1);
          assert.ok(Math.hypot(p.vx, p.vy) <= 1.2 + 1e-10);
        }
      }
});

test("attractors clamp to the field, respect the four-point cap, and reject invalid forces", () => {
  const added = addLoomAttractor(defaultAttractors, { x: 5, y: -5 });
  assert.deepEqual(added[2], { x: 1, y: -1 });
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

test("viewport mapping reaches every rectangle edge and inverts pointer coordinates", () => {
  for (const [width, height] of [
    [1000, 600],
    [254, 254],
    [600, 320],
    [320, 600],
  ]) {
    const viewport = loomViewport(width, height);
    assert.deepEqual(projectLoomPoint({ x: -1, y: -1 }, viewport), {
      x: 24,
      y: 24,
    });
    assert.deepEqual(projectLoomPoint({ x: 1, y: 1 }, viewport), {
      x: width - 24,
      y: height - 24,
    });
    for (const point of [
      { x: 0, y: 0 },
      { x: 0.75, y: -0.9 },
      { x: -1, y: 1 },
    ]) {
      const result = unprojectLoomPoint(
        projectLoomPoint(point, viewport),
        viewport,
      );
      assert.ok(Math.abs(result.x - point.x) < 1e-12);
      assert.ok(Math.abs(result.y - point.y) < 1e-12);
    }
  }
});

test("a held corner attractor pulls particles beyond the former central boundary", () => {
  let particles = [{ x: 0.72, y: 0.72, vx: 0, vy: 0 }];
  let furthest = 0;
  for (let i = 0; i < 600; i++) {
    particles = stepLoom(particles, [{ x: 1, y: 1 }], "orbit", 1, 0);
    furthest = Math.max(furthest, Math.min(particles[0].x, particles[0].y));
    assert.ok(Math.abs(particles[0].x) <= 1 && Math.abs(particles[0].y) <= 1);
  }
  assert.ok(furthest > 0.9);
});
