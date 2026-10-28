import type {
  SculpturePoint,
  SculptureView,
} from "../../src/domain/playground/signal-sculpture";

// Allocating projection formulas retained from 48d05b2; evaluated on each platform.
export function referenceSculpturePoint(
  point: SculpturePoint,
  spin: number,
  view: SculptureView,
) {
  const x = point.x * Math.cos(spin) + point.z * Math.sin(spin);
  const z = point.z * Math.cos(spin) - point.x * Math.sin(spin);
  const yaw = view.x * 0.18;
  const pitch = -view.y * 0.16;
  const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const turnedZ = z * Math.cos(yaw) - x * Math.sin(yaw);
  const y = point.y * Math.cos(pitch) - turnedZ * Math.sin(pitch);
  const depth = point.y * Math.sin(pitch) + turnedZ * Math.cos(pitch);
  const perspective = 2.8 / (2.8 - depth);
  return {
    x: turnedX * perspective + view.x * 0.12,
    y: y * perspective + view.y * 0.12,
    depth,
  };
}
