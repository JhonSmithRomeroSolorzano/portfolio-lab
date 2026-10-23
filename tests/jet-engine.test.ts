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
    ["--import", "tsx", "scripts/build-jet-engine.mjs", "--check"],
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
    }
  assert.ok(
    bytes < 80 * 1024,
    `Both theme pairs use ${bytes} compressed bytes.`,
  );
});
