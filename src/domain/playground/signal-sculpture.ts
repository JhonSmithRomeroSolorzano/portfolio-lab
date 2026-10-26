export type SculptureForm = "monogram" | "ribbon" | "orbit";
export type SculpturePoint = { x: number; y: number; z: number };
export type SculptureView = Pick<SculpturePoint, "x" | "y">;
export const sculptureForms: readonly SculptureForm[] = [
  "monogram",
  "ribbon",
  "orbit",
];

// Authored stroke paths, independent of fonts and browser text rasterization.
const strokes = [
  [
    [-0.85, -0.36],
    [-0.43, -0.36],
    [-0.43, 0.23],
    [-0.5, 0.36],
    [-0.72, 0.36],
    [-0.85, 0.23],
  ],
  [
    [0.23, -0.36],
    [-0.13, -0.36],
    [-0.23, -0.23],
    [-0.23, -0.1],
    [0.2, 0.1],
    [0.2, 0.23],
    [0.1, 0.36],
    [-0.23, 0.36],
  ],
  [
    [0.43, 0.36],
    [0.43, -0.36],
    [0.73, -0.36],
    [0.85, -0.24],
    [0.85, -0.1],
    [0.73, 0],
    [0.43, 0],
  ],
  [
    [0.66, 0],
    [0.87, 0.36],
  ],
];
const segments = strokes.flatMap((stroke) =>
  stroke.slice(1).map((end, i) => ({ start: stroke[i], end })),
);

/** Stable point identities let every form morph without random frame-to-frame noise. */
export function sculpturePoints(
  form: SculptureForm,
  count: number,
): SculpturePoint[] {
  if (!Number.isInteger(count) || count < 1 || count > 2400)
    throw new Error("Sculpture point count must be between 1 and 2400.");
  return Array.from({ length: count }, (_, i) => {
    const u = i / count;
    const angle = u * Math.PI * 2;
    const strand = i % 6;
    if (form === "ribbon") {
      const t = u * Math.PI * 4;
      const width = (strand - 2.5) * 0.036;
      return {
        x: (u - 0.5) * 1.7,
        y: Math.sin(t) * 0.3 + Math.cos(t) * width,
        z: Math.cos(t) * 0.35 + Math.sin(t) * width,
      };
    }
    if (form === "orbit") {
      const ring = (strand * Math.PI) / 6;
      return {
        x: Math.cos(angle) * 0.73,
        y: Math.sin(angle) * Math.cos(ring) * 0.53,
        z: Math.sin(angle) * Math.sin(ring) * 0.53,
      };
    }
    const segment = segments[i % segments.length];
    const t = (Math.floor(i / segments.length) * 0.61803398875) % 1;
    const offset = Math.sin(i * 13.37) * 0.013;
    return {
      x: segment.start[0] + (segment.end[0] - segment.start[0]) * t + offset,
      y: segment.start[1] + (segment.end[1] - segment.start[1]) * t + offset,
      z: Math.cos(i * 2.4) * 0.045,
    };
  });
}

export function morphPoint(
  from: SculpturePoint,
  to: SculpturePoint,
  progress: number,
  index: number,
): SculpturePoint {
  const t = Math.max(0, Math.min(1, progress));
  const ease = t * t * (3 - 2 * t);
  const scatter = Math.sin(Math.PI * t) * 0.24;
  return {
    x: from.x + (to.x - from.x) * ease + Math.sin(index * 2.3) * scatter,
    y: from.y + (to.y - from.y) * ease + Math.cos(index * 1.7) * scatter,
    z: from.z + (to.z - from.z) * ease + Math.sin(index) * scatter,
  };
}

/** Ease the view at the same rate on different displays, including its return. */
export function approachSculptureView(
  current: SculptureView,
  target: SculptureView,
  seconds: number,
): SculptureView {
  const blend = 1 - Math.exp(-Math.max(0, seconds) / 0.12);
  const approach = (value: number, destination: number) =>
    value + (Math.max(-0.5, Math.min(0.5, destination)) - value) * blend;
  return { x: approach(current.x, target.x), y: approach(current.y, target.y) };
}

/** Apply the view after the object's spin, with a small depth-independent pan. */
export function projectSculpturePoint(
  point: SculpturePoint,
  spin: number,
  view: SculptureView,
  out?: { x: number; y: number; depth: number },
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
  if (out) {
    out.x = turnedX * perspective + view.x * 0.12;
    out.y = y * perspective + view.y * 0.12;
    out.depth = depth;
    return out;
  }
  return {
    x: turnedX * perspective + view.x * 0.12,
    y: y * perspective + view.y * 0.12,
    depth,
  };
}
