import assert from "node:assert/strict";
import test from "node:test";
import {
  NAME_RAIN_DURATION,
  nameRainCoverage,
  nameRainReveal,
  nameRainSeed,
} from "../src/shared/canvas/rain-name-model";

test("isolated highlights progressively illuminate the name, with no glyph destinations", () => {
  const coverage = [0, 1200, 2400, 3250, NAME_RAIN_DURATION].map(() => 0);
  for (let index = 0; index < 1000; index++) {
    const seed = nameRainSeed(index);
    assert.equal(seed, nameRainSeed(index));
    assert.ok(seed >= 0 && seed < 1);
    [0, 1200, 2400, 3250, NAME_RAIN_DURATION].forEach((time, i) => {
      if (nameRainReveal(seed, time) > 0.75) coverage[i]++;
    });
    assert.equal(nameRainReveal(seed, 0), 0);
    assert.equal(nameRainReveal(seed, NAME_RAIN_DURATION), 1);
    let previous = 0;
    for (let time = 0; time <= NAME_RAIN_DURATION; time += 17) {
      const light = nameRainReveal(seed, time);
      assert.ok(light >= previous && light <= 1);
      assert.ok(light - previous < 0.052);
      previous = light;
    }
  }
  assert.equal(coverage[0], 0);
  assert.ok(coverage[1] > 0 && coverage[1] < 50);
  assert.ok(coverage[2] > coverage[1] * 3);
  assert.ok(coverage[3] > coverage[2] && coverage[3] < 800);
  assert.equal(coverage[4], 1000);
});

test("name stencil coverage matches direct alpha sums without a separate rain grid", () => {
  const width = 21,
    height = 13;
  const alpha = Array.from({ length: width * height }, (_, i) =>
    Math.floor(nameRainSeed(i) * 256),
  );
  const integral = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += alpha[y * width + x];
      integral[(y + 1) * (width + 1) + x + 1] =
        integral[y * (width + 1) + x + 1] + row;
    }
  }
  for (let i = 0; i < 1000; i++) {
    const left = nameRainSeed(i + 1) * 30 - 5;
    const top = nameRainSeed(i + 2) * 20 - 4;
    const right = left + nameRainSeed(i + 3) * 15;
    const bottom = top + nameRainSeed(i + 4) * 12;
    const l = Math.max(0, Math.min(width, Math.floor(left))),
      r = Math.max(0, Math.min(width, Math.ceil(right)));
    const t = Math.max(0, Math.min(height, Math.floor(top))),
      b = Math.max(0, Math.min(height, Math.ceil(bottom)));
    let sum = 0;
    for (let y = t; y < b; y++)
      for (let x = l; x < r; x++) sum += alpha[y * width + x];
    const expected = r <= l || b <= t ? 0 : sum / ((r - l) * (b - t) * 255);
    assert.equal(
      nameRainCoverage(integral, width, height, left, top, right, bottom),
      expected,
    );
  }
});
