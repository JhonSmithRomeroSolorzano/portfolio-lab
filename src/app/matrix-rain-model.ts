export type RainBoundary = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export const RAIN_GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ012345789:=";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function rainSeed(column: number, salt = 0) {
  const value = Math.sin(column * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function rainColumn(column: number, rows: number) {
  const speed = 5 + rainSeed(column, 2) * 13;
  const tail = 24 + rainSeed(column, 3) * 40;
  const cycle = rows + tail + 8 + rainSeed(column, 4) * 24;
  return {
    speed,
    tail,
    cycle,
    offset: rainSeed(column, 5) * cycle,
    depth: 0.65 + rainSeed(column, 6) * 0.35,
  };
}

/** Cells stay in place; a bright front travels downward and leaves a fading tail. */
export function rainCellLight(
  stream: ReturnType<typeof rainColumn>,
  row: number,
  ambient: number,
  time: number,
) {
  const { speed, tail, cycle, offset, depth } = stream;
  const front = (time * speed + offset) % cycle;
  const behind = front - row;
  if (behind < 0 || behind > tail) return ambient;
  const head = behind < 1.6 ? 1 : 0.78 * (1 - behind / tail) ** 1.25;
  return clamp(ambient + head * depth);
}

export function rainLight(
  column: number,
  row: number,
  rows: number,
  time: number,
) {
  return rainCellLight(
    rainColumn(column, rows),
    row,
    0.015 + rainSeed(column, row + 10) * 0.045,
    time,
  );
}

/** Translucent interiors and a luminous edge keep the field continuous. */
export function rainEnvelope(
  x: number,
  y: number,
  boundaries: readonly RainBoundary[],
) {
  let quiet = 1;
  let edge = 0;
  for (const box of boundaries) {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    if (dx > 40 || dy > 40) continue;
    const inside = dx === 0 && dy === 0;
    const distance = inside
      ? Math.min(x - box.left, box.right - x, y - box.top, box.bottom - y)
      : Math.hypot(dx, dy);
    if (inside) quiet = Math.min(quiet, 0.42 + clamp(distance / 14) * 0.08);
    if (distance < 40) edge = Math.max(edge, Math.exp(-distance / 7));
  }
  return { quiet, edge };
}
