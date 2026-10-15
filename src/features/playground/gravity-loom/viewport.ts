import type { LoomPoint } from "../../../domain/playground/gravity-loom";

/** Normalized field coordinates fill the rectangle, not its shortest-side square. */
export function loomViewport(width: number, height: number) {
  const inset = Math.min(24, width / 4, height / 4);
  return {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    scaleX: Math.max(1, width / 2 - inset),
    scaleY: Math.max(1, height / 2 - inset),
  };
}

export function projectLoomPoint(
  point: LoomPoint,
  viewport: ReturnType<typeof loomViewport>,
): LoomPoint {
  return {
    x: viewport.centerX + point.x * viewport.scaleX,
    y: viewport.centerY + point.y * viewport.scaleY,
  };
}

export function unprojectLoomPoint(
  point: LoomPoint,
  viewport: ReturnType<typeof loomViewport>,
): LoomPoint {
  return {
    x: (point.x - viewport.centerX) / viewport.scaleX,
    y: (point.y - viewport.centerY) / viewport.scaleY,
  };
}
