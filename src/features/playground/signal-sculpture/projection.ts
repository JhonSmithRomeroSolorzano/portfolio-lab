import {
  projectSculpturePoint,
  type SculpturePoint,
  type SculptureView,
} from "../../../domain/playground/signal-sculpture";

type Projected = { x: number; y: number; depth: number; i: number };

/** Renderer-owned scratch; restore source order before each stable depth sort. */
export function createSculptureProjection(count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 2400)
    throw new RangeError("Invalid sculpture projection count.");
  const records: Projected[] = Array.from({ length: count }, (_, i) => ({
    x: 0,
    y: 0,
    depth: 0,
    i,
  }));
  const ordered = records.slice();
  const displaced: SculpturePoint = { x: 0, y: 0, z: 0 };
  return {
    sample(
      points: readonly SculpturePoint[],
      width: number,
      height: number,
      spin: number,
      view: SculptureView,
      pulse: number,
    ): readonly Projected[] {
      if (points.length !== count)
        throw new RangeError("Projection count changed.");
      const scale = Math.min(width * 0.46, height * 0.73);
      for (let i = 0; i < count; i++) {
        const point = points[i];
        const wave =
          Math.exp(
            -Math.pow((Math.hypot(point.x, point.y) - pulse * 0.65) * 9, 2),
          ) * 0.12;
        displaced.x = point.x;
        displaced.y = point.y;
        displaced.z = point.z + wave;
        const projected = projectSculpturePoint(
          displaced,
          spin,
          view,
          records[i],
        );
        records[i].x = width / 2 + projected.x * scale;
        records[i].y = height / 2 + projected.y * scale;
        ordered[i] = records[i];
      }
      ordered.sort((a, b) => a.depth - b.depth);
      return ordered;
    },
  };
}
