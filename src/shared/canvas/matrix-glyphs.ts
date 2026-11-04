export const RAIN_GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ012345789:=";

export const RAIN_LEVELS = 24;
export const RAIN_TILE_WIDTH = 12;
export const RAIN_TILE_HEIGHT = 16;

/** Shared typography, mirroring, glow, and shading for backdrop AND name. */
export function paintMatrixGlyphs(
  atlas: HTMLCanvasElement,
  ink: CanvasRenderingContext2D,
  low: string,
  head: string,
) {
  atlas.width = RAIN_GLYPHS.length * RAIN_TILE_WIDTH;
  atlas.height = RAIN_LEVELS * RAIN_TILE_HEIGHT;
  ink.font = '14px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace';
  ink.textAlign = "center";
  ink.textBaseline = "middle";
  for (let level = 0; level < RAIN_LEVELS; level++) {
    ink.globalAlpha = ((level + 1) / RAIN_LEVELS) ** 0.8;
    ink.fillStyle = level > RAIN_LEVELS * 0.86 ? head : low;
    ink.shadowColor = head;
    ink.shadowBlur = level > RAIN_LEVELS * 0.72 ? 3 : 0;
    for (let glyph = 0; glyph < RAIN_GLYPHS.length; glyph++) {
      ink.save();
      ink.translate(
        glyph * RAIN_TILE_WIDTH + RAIN_TILE_WIDTH / 2,
        level * RAIN_TILE_HEIGHT + RAIN_TILE_HEIGHT / 2,
      );
      if (glyph % 3) ink.scale(-1, 1);
      ink.fillText(RAIN_GLYPHS[glyph], 0, 0);
      ink.restore();
    }
  }
  ink.globalAlpha = 1;
  ink.shadowBlur = 0;
}
