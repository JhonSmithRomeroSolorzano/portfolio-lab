import assert from "node:assert/strict";
import test from "node:test";
import {
  RAIN_GLYPHS,
  rainEnvelope,
  rainLight,
  rainSeed,
} from "../src/app/matrix-rain-model";

test("rain is deterministic, bounded and uses the fine half-width glyph set", () => {
  assert.match(RAIN_GLYPHS, /[ｱ-ﾝ]/);
  for (let column = 0; column < 160; column++) {
    assert.equal(rainSeed(column, 2), rainSeed(column, 2));
    assert.ok(rainSeed(column, 2) >= 0 && rainSeed(column, 2) < 1);
    for (let row = 0; row < 110; row++) {
      for (const time of [0, 1.5, 4000]) {
        const light = rainLight(column, row, 110, time);
        assert.ok(Number.isFinite(light) && light >= 0 && light <= 1);
      }
    }
  }
});

test("bright fronts advance down the grid while different columns stay asynchronous", () => {
  const peak = (column: number, time: number) => {
    const levels = Array.from({ length: 100 }, (_, row) =>
      rainLight(column, row, 100, time),
    );
    const value = Math.max(...levels);
    return { row: levels.indexOf(value), value };
  };
  let advancing = 0;
  const positions = new Set<number>();
  for (let column = 0; column < 40; column++) {
    const before = peak(column, 0);
    const after = peak(column, 0.4);
    positions.add(before.row);
    if (before.value > 0.2 && after.value > 0.2 && before.row < 90) {
      assert.ok(after.row > before.row);
      advancing++;
    }
  }
  assert.ok(advancing > 5);
  assert.ok(positions.size > 10);
});

test("layout envelopes protect text interiors and trace the actual movable boundaries", () => {
  const panel = { left: 20, top: 20, right: 120, bottom: 120 };
  const interior = rainEnvelope(70, 70, [panel]);
  const edge = rainEnvelope(19, 70, [panel]);
  const outside = rainEnvelope(300, 70, [panel]);
  assert.ok(interior.quiet < 0.1);
  assert.ok(edge.edge > 0.8);
  assert.equal(outside.quiet, 1);
  assert.ok(outside.edge < 0.001);
  assert.deepEqual(
    rainEnvelope(219, 70, [{ ...panel, left: 220, right: 320 }]),
    edge,
  );
  assert.deepEqual(rainEnvelope(20, 20, []), { quiet: 1, edge: 0 });
});
