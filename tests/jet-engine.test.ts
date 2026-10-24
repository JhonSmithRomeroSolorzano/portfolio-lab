import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import {
  airPoint,
  approachSpool,
  bladePolygon,
  ENGINE_CENTER,
  enginePower,
  engineSpeed,
  flowOpacity,
  ROTORS,
  approachReverser,
  reverserSolids,
  reverserVertices,
  reverserFlowWeight,
} from "../src/domain/playground/jet-engine";
import { engineFaces } from "../src/features/playground/jet-engine/mesh";

test("engine speed drives bounded, strictly increasing visual motion, density and exhaust reach", () => {
  assert.equal(engineSpeed(-1), 0);
  assert.equal(engineSpeed(120), 100);
  assert.throws(() => engineSpeed(NaN), RangeError);
  let previous = enginePower(0);
  assert.deepEqual(
    [previous.flow, previous.rotation, previous.density, previous.reach],
    [0, 0, 0, 0],
  );
  for (let speed = 1; speed <= 100; speed++) {
    const power = enginePower(speed);
    for (const key of ["flow", "rotation", "density", "reach", "heat"] as const)
      assert.ok(power[key] > previous[key]);
    assert.ok(power.throttle > 0 && power.throttle <= 1);
    previous = power;
  }
  let spool = 25;
  for (let i = 0; i < 120; i++) {
    const next = approachSpool(spool, 100, 1 / 60);
    assert.ok(next >= spool && next <= 100);
    spool = next;
  }
  assert.ok(spool > 99);
  assert.equal(approachSpool(35, 100, 0), 35);
});

test("air paths stay continuous, separate bypass from core walls, and fade at both ends", () => {
  assert.equal(flowOpacity(0), 0);
  assert.equal(flowOpacity(1), 0);
  for (const speed of [1, 25, 60, 100]) {
    const power = enginePower(speed);
    for (let route = 0; route < 36; route++) {
      let previous = airPoint(route, 0, power);
      for (let step = 0; step <= 1000; step++) {
        const u = step / 1000,
          point = airPoint(route, u, power);
        assert.ok(point.every(Number.isFinite));
        assert.ok(point[0] >= previous[0]);
        assert.ok(
          Math.hypot(...point.map((value, i) => value - previous[i])) < 3,
        );
        const radius = Math.hypot(point[1], point[2] - ENGINE_CENTER);
        if (point[0] > -104 && point[0] < 140) {
          if (route % 3) assert.ok(radius > 35 && radius < 57);
          else assert.ok(radius > 5 && radius < 28);
        }
        assert.ok(flowOpacity(u) >= 0 && flowOpacity(u) <= 1);
        previous = point;
      }
    }
  }
});

test("reverse thrust turns only the bypass forward, never the intake, core exhaust, or rotation", () => {
  for (const speed of [0, 1, 25, 60, 100]) {
    const power = enginePower(speed);
    assert.ok(power.rotation >= 0);
    for (let route = 0; route < 36; route++) {
      let previous = airPoint(route, 0, power, "reverse");
      assert.deepEqual(previous, airPoint(route, 0, power));
      for (let step = 1; step <= 1000; step++) {
        const u = step / 1000,
          p = airPoint(route, u, power, "reverse");
        assert.ok(p.every(Number.isFinite));
        assert.ok(Math.hypot(...p.map((v, i) => v - previous[i])) < 3);
        if (route % 3 === 0) assert.deepEqual(p, airPoint(route, u, power));
        else {
          if (u < 0.62) assert.ok(p[0] > previous[0]);
          if (u > 0.8) assert.ok(p[0] < previous[0]);
          if (u > 0.78) assert.ok(Math.hypot(p[1], p[2] - ENGINE_CENTER) > 57);
        }
        previous = p;
      }
    }
  }
});

test("reverser panels are rigid, finite, and deploy progressively without changing blade poses", () => {
  const rest = reverserSolids(0);
  assert.equal(rest.length, 60);
  let progress = 0;
  for (let frame = 0; frame < 150; frame++) {
    const next = approachReverser(progress, 1, 1 / 60);
    assert.ok(next >= progress && next <= 1);
    progress = next;
  }
  assert.equal(progress, 1);
  assert.equal(approachReverser(0.5, 1, 0), 0.5);
  for (const d of [0, 0.25, 0.5, 0.75, 0.85])
    assert.equal(reverserFlowWeight(d), 0);
  assert.equal(reverserFlowWeight(1), 1);
  let closing = 0.8;
  for (let i = 0; i < 20; i++) {
    const next = approachReverser(closing, 0, 1 / 60);
    assert.ok(next < closing);
    closing = next;
  }
  assert.ok(
    approachReverser(closing, 1, 1 / 60) > closing,
    "retargeting continues from the current door pose",
  );
  for (const d of [0, 0.1, 0.25, 0.5, 0.75, 1])
    reverserSolids(d).forEach((solid, i) => {
      const vertices = reverserVertices(solid),
        base = reverserVertices(rest[i]);
      assert.ok(vertices.flat().every(Number.isFinite));
      for (let a = 0; a < vertices.length; a++)
        for (let b = a + 1; b < vertices.length; b++)
          assert.ok(
            Math.abs(
              Math.hypot(...vertices[a].map((v, j) => v - vertices[b][j])) -
                Math.hypot(...base[a].map((v, j) => v - base[b][j])),
            ) < 1e-8,
          );
    });
  assert.notDeepEqual(engineFaces(0, 0), engineFaces(0, 1));
});

test("moving blades remain in their radial and axial clearances at every sampled angle", () => {
  for (let i = 0; i < ROTORS.length; i++) {
    const rotor = ROTORS[i],
      limit = i === 0 ? 60 : i < 5 ? 28 : 26;
    for (let step = 0; step < 120; step++)
      for (const [y, z] of bladePolygon(rotor.radius, (step * Math.PI) / 60)) {
        const radius = Math.hypot(y, z);
        assert.ok(radius >= 9 - 1e-9 && radius < limit);
      }
    if (i) assert.ok(rotor.x - ROTORS[i - 1].x > 4);
  }
  const a = engineFaces(0),
    b = engineFaces(0.4);
  assert.notDeepEqual(a, b);
  for (const face of b) {
    assert.ok(Number.isFinite(face.depth));
    assert.ok(face.shade >= 0 && face.shade <= 4);
    assert.ok(face.points.flat().every(Number.isFinite));
  }
});

test("Anatomy engine artwork reproduces with measured static depth order and bounded SVG assets", () => {
  execFileSync(
    process.execPath,
    ["--import", "tsx", "scripts/build-jet-engine.mjs", "--audit", "--check"],
    { encoding: "utf8" },
  );
  let bytes = 0;
  for (const theme of ["light", "dark"])
    for (const layer of ["back"]) {
      const svg = readFileSync(
        `src/features/playground/jet-engine/engine-${layer}-${theme}.svg`,
        "utf8",
      );
      bytes += gzipSync(svg).length;
      assert.match(svg, /viewBox="0 0 1100 480"/);
      assert.doesNotMatch(svg, /<script|https?:\/\/(?!www.w3.org)/);
      assert.doesNotMatch(svg, /<circle|class="iso-dots"/);
    }
  assert.ok(
    bytes < 80 * 1024,
    `Both theme pairs use ${bytes} compressed bytes.`,
  );
});
