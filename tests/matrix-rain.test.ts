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
  assert.ok(Math.abs(interior.quiet - 0.24) < 1e-12);
  assert.ok(edge.edge > 0.8);
  assert.equal(outside.quiet, 1);
  assert.ok(outside.edge < 0.001);
  assert.deepEqual(
    rainEnvelope(219, 70, [{ ...panel, left: 220, right: 320 }]),
    edge,
  );
  assert.deepEqual(rainEnvelope(20, 20, []), { quiet: 1, edge: 0 });
});

test("reading interiors halve their lighting envelope without changing exterior or edge falloff", () => {
  const panel = { left: 0, top: 0, right: 300, bottom: 300 };
  for (const distance of [0, 1, 7, 14, 30, 100, 150]) {
    const current = rainEnvelope(distance, 150, [panel]);
    const previousQuiet = 0.42 + Math.min(1, distance / 14) * 0.08;
    assert.ok(current.quiet > 0 && current.quiet <= previousQuiet / 2);
    assert.equal(current.edge, distance < 40 ? Math.exp(-distance / 7) : 0);
  }
  for (const distance of [1, 7, 14, 39, 40, 100]) {
    const exterior = rainEnvelope(-distance, 150, [panel]);
    assert.equal(exterior.quiet, 1);
    assert.equal(exterior.edge, distance < 40 ? Math.exp(-distance / 7) : 0);
  }
});

test("overlapping reading regions use the quietest envelope without multiplying it away", () => {
  const outer = { left: 0, top: 0, right: 300, bottom: 300 };
  const inner = { left: 50, top: 50, right: 250, bottom: 250 };
  for (const [x, y] of [
    [51, 150],
    [150, 150],
    [249, 249],
  ]) {
    const a = rainEnvelope(x, y, [outer]);
    const b = rainEnvelope(x, y, [inner]);
    const combined = rainEnvelope(x, y, [outer, inner]);
    assert.equal(combined.quiet, Math.min(a.quiet, b.quiet));
    assert.equal(combined.edge, Math.max(a.edge, b.edge));
    assert.deepEqual(rainEnvelope(x, y, [inner, outer]), combined);
  }
});
