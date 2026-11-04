import assert from "node:assert/strict";
import test from "node:test";
import {
  RAIN_GLYPHS,
  RAIN_LEVELS,
  RAIN_TILE_HEIGHT,
  RAIN_TILE_WIDTH,
  paintMatrixGlyphs,
} from "../src/shared/canvas/matrix-glyphs";

test("the shared rain atlas keeps the original inventory, mirroring, font and shades", () => {
  const atlas = { width: 0, height: 0 } as HTMLCanvasElement;
  let mirrored = false;
  const painted: {
    glyph: string;
    mirrored: boolean;
    color: string;
    alpha: number;
  }[] = [];
  const context = {
    font: "",
    textAlign: "",
    textBaseline: "",
    globalAlpha: 1,
    fillStyle: "",
    shadowColor: "",
    shadowBlur: 0,
    save() {
      mirrored = false;
    },
    restore() {},
    translate() {},
    scale(x: number, y: number) {
      assert.equal(x, -1);
      assert.equal(y, 1);
      mirrored = true;
    },
    fillText(glyph: string) {
      painted.push({
        glyph,
        mirrored,
        color: this.fillStyle,
        alpha: this.globalAlpha,
      });
    },
  };
  paintMatrixGlyphs(
    atlas,
    context as unknown as CanvasRenderingContext2D,
    "#458329",
    "#244d16",
  );
  assert.equal(atlas.width, RAIN_GLYPHS.length * 12);
  assert.equal(atlas.height, 24 * 16);
  assert.equal(RAIN_TILE_WIDTH, 12);
  assert.equal(RAIN_TILE_HEIGHT, 16);
  assert.equal(RAIN_LEVELS, 24);
  assert.equal(
    context.font,
    '14px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace',
  );
  assert.equal(painted.length, RAIN_GLYPHS.length * RAIN_LEVELS);
  for (let level = 0; level < RAIN_LEVELS; level++) {
    for (let index = 0; index < RAIN_GLYPHS.length; index++) {
      const glyph = painted[level * RAIN_GLYPHS.length + index];
      assert.equal(glyph.glyph, RAIN_GLYPHS[index]);
      assert.equal(glyph.mirrored, index % 3 !== 0);
      assert.equal(glyph.color, level > 24 * 0.86 ? "#244d16" : "#458329");
      assert.equal(glyph.alpha, ((level + 1) / 24) ** 0.8);
    }
  }
  assert.equal(context.globalAlpha, 1);
  assert.equal(context.shadowBlur, 0);
});
