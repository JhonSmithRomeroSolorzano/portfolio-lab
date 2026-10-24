/** Fixed-camera geometry shared by authoring, canvas visibility, and SVG fallback. */
export type DepthPoint = readonly [number, number, number];
export type DepthTriangle = {
  vertices: readonly [DepthPoint, DepthPoint, DepthPoint];
  bounds: readonly [number, number, number, number];
  plane: readonly [number, number, number];
};
export const DEPTH_EPSILON = 0.002;
const cross = (a: DepthPoint, b: DepthPoint, p: DepthPoint) =>
  (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const hasArea = (polygon: readonly DepthPoint[]) =>
  Math.abs(
    polygon.reduce(
      (sum, p, i) =>
        sum +
        p[0] * polygon[(i + 1) % polygon.length][1] -
        polygon[(i + 1) % polygon.length][0] * p[1],
      0,
    ),
  ) > 1e-7;
export const interpolate = (
  a: DepthPoint,
  b: DepthPoint,
  t: number,
): DepthPoint => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function triangle(
  vertices: readonly [DepthPoint, DepthPoint, DepthPoint],
): DepthTriangle | undefined {
  const [a, b, c] = vertices,
    area = cross(a, b, c);
  if (Math.abs(area) < 1e-8) return undefined;
  const dx =
    ((b[2] - a[2]) * (c[1] - a[1]) - (c[2] - a[2]) * (b[1] - a[1])) / area;
  const dy =
    ((b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2])) / area;
  return {
    vertices: area > 0 ? vertices : [a, c, b],
    bounds: [
      Math.min(a[0], b[0], c[0]),
      Math.min(a[1], b[1], c[1]),
      Math.max(a[0], b[0], c[0]),
      Math.max(a[1], b[1], c[1]),
    ],
    plane: [dx, dy, a[2] - dx * a[0] - dy * a[1]],
  };
}
export const planeDepth = (t: DepthTriangle, x: number, y: number) =>
  t.plane[0] * x + t.plane[1] * y + t.plane[2];
export function covers(t: DepthTriangle, x: number, y: number) {
  const p: [number, number, number] = [x, y, 0],
    v = t.vertices;
  return (
    cross(v[0], v[1], p) >= -1e-7 &&
    cross(v[1], v[2], p) >= -1e-7 &&
    cross(v[2], v[0], p) >= -1e-7
  );
}

/** Ear clipping, not a fan: swept blades have concave caps. */
export function triangulate(input: readonly DepthPoint[]): DepthTriangle[] {
  const points = input.filter(
    (p, i) =>
      Math.hypot(
        p[0] - input[(i + 1) % input.length][0],
        p[1] - input[(i + 1) % input.length][1],
      ) > 1e-7,
  );
  const result: DepthTriangle[] = [],
    indices = points.map((_, i) => i);
  const area = points.reduce(
    (sum, p, i) =>
      sum +
      p[0] * points[(i + 1) % points.length][1] -
      points[(i + 1) % points.length][0] * p[1],
    0,
  );
  if (area < 0) indices.reverse();
  let guard = points.length * points.length;
  while (indices.length > 3 && guard-- > 0) {
    let found = false;
    for (let i = 0; i < indices.length; i++) {
      const a = indices[(i + indices.length - 1) % indices.length],
        b = indices[i],
        c = indices[(i + 1) % indices.length];
      if (cross(points[a], points[b], points[c]) <= 1e-8) continue;
      const ear = triangle([points[a], points[b], points[c]])!;
      if (
        indices.some(
          (j) =>
            j !== a &&
            j !== b &&
            j !== c &&
            covers(ear, points[j][0], points[j][1]),
        )
      )
        continue;
      result.push(ear);
      indices.splice(i, 1);
      found = true;
      break;
    }
    if (!found) break;
  }
  if (indices.length === 3) {
    const last = triangle([
      points[indices[0]],
      points[indices[1]],
      points[indices[2]],
    ]);
    if (last) result.push(last);
  }
  return result;
}

export type IndexedDepthMesh = {
  vertices: number[];
  triangles: number[];
  encoding?: string;
};
export function decodeDepthMesh(mesh: IndexedDepthMesh): DepthTriangle[] {
  let vertices = mesh.vertices,
    indices = mesh.triangles;
  if (mesh.encoding === "delta-v1") {
    const last = [0, 0, 0];
    vertices = vertices.map((value, i) => {
      const axis = i % 3;
      last[axis] += value;
      return last[axis] / (axis === 2 ? 1000 : 10);
    });
    let index = 0;
    indices = indices.map((value) => (index += value));
  }
  const result: DepthTriangle[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const points = indices
      .slice(i, i + 3)
      .map(
        (index) =>
          vertices.slice(index * 3, index * 3 + 3) as [number, number, number],
      );
    const t = triangle([points[0], points[1], points[2]]);
    if (t) result.push(t);
  }
  return result;
}

/** A spatial index accelerates exact face/line queries; it does not decide depth. */
export class DepthIndex {
  private cells = new Map<string, DepthTriangle[]>();
  constructor(
    readonly triangles: readonly DepthTriangle[],
    private cell = 32,
  ) {
    for (const t of triangles)
      this.eachCell(t.bounds, (key) => {
        const bucket = this.cells.get(key) || [];
        bucket.push(t);
        this.cells.set(key, bucket);
      });
  }
  private eachCell(bounds: readonly number[], visit: (key: string) => void) {
    for (
      let y = Math.floor(bounds[1] / this.cell);
      y <= Math.floor(bounds[3] / this.cell);
      y++
    )
      for (
        let x = Math.floor(bounds[0] / this.cell);
        x <= Math.floor(bounds[2] / this.cell);
        x++
      )
        visit(`${x},${y}`);
  }
  query(bounds: readonly number[]): DepthTriangle[] {
    const found = new Set<DepthTriangle>();
    this.eachCell(bounds, (key) => {
      for (const t of this.cells.get(key) || [])
        if (
          t.bounds[0] <= bounds[2] &&
          t.bounds[2] >= bounds[0] &&
          t.bounds[1] <= bounds[3] &&
          t.bounds[3] >= bounds[1]
        )
          found.add(t);
    });
    return [...found];
  }
  nearest(x: number, y: number) {
    let depth = -Infinity;
    for (const t of this.query([x, y, x, y]))
      if (covers(t, x, y)) depth = Math.max(depth, planeDepth(t, x, y));
    return depth;
  }
}

function clip(
  polygon: readonly DepthPoint[],
  distance: (p: DepthPoint) => number,
): DepthPoint[] {
  const output: DepthPoint[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length],
      da = distance(a),
      db = distance(b);
    if (da >= 0) output.push(a);
    if (da >= 0 !== db >= 0) output.push(interpolate(a, b, da / (da - db)));
  }
  return output;
}
function subtract(
  polygon: readonly DepthPoint[],
  occluder: readonly DepthPoint[],
): DepthPoint[][] {
  let remaining = [...polygon];
  const outside: DepthPoint[][] = [];
  for (let i = 0; i < occluder.length && remaining.length >= 3; i++) {
    const a = occluder[i],
      b = occluder[(i + 1) % occluder.length];
    const piece = clip(remaining, (p) => -cross(a, b, p));
    if (piece.length >= 3 && hasArea(piece)) outside.push(piece);
    remaining = clip(remaining, (p) => cross(a, b, p));
  }
  return outside;
}

/** SVG fallback uses the same depth planes as the canvas, not CSS layer guesses. */
export function visiblePolygons(
  target: DepthTriangle,
  index: DepthIndex,
): DepthPoint[][] {
  let fragments: DepthPoint[][] = [[...target.vertices]];
  for (const other of index.query(target.bounds)) {
    if (other === target) continue;
    const nearer = clip(
      other.vertices,
      (p) =>
        planeDepth(other, p[0], p[1]) -
        planeDepth(target, p[0], p[1]) -
        DEPTH_EPSILON,
    );
    if (nearer.length < 3 || !hasArea(nearer)) continue;
    fragments = fragments.flatMap((fragment) => subtract(fragment, nearer));
    if (!fragments.length) break;
  }
  return fragments;
}

export function visibleLine(
  a: DepthPoint,
  b: DepthPoint,
  index: DepthIndex,
  padding = 0,
): [DepthPoint, DepthPoint][] {
  const bounds = [
    Math.min(a[0], b[0]) - padding,
    Math.min(a[1], b[1]) - padding,
    Math.max(a[0], b[0]) + padding,
    Math.max(a[1], b[1]) + padding,
  ];
  const hidden: [number, number][] = [];
  for (const t of index.query(bounds)) {
    let low = 0,
      high = 1;
    const constrain = (da: number, db: number) => {
      if (da < 0 && db < 0) {
        high = -1;
        return;
      }
      if (da < 0) low = Math.max(low, da / (da - db));
      else if (db < 0) high = Math.min(high, da / (da - db));
    };
    for (let i = 0; i < 3; i++) {
      const p = t.vertices[i],
        q = t.vertices[(i + 1) % 3],
        margin = padding * Math.hypot(q[0] - p[0], q[1] - p[1]);
      constrain(cross(p, q, a) + margin, cross(p, q, b) + margin);
    }
    constrain(
      planeDepth(t, a[0], a[1]) - a[2] - DEPTH_EPSILON,
      planeDepth(t, b[0], b[1]) - b[2] - DEPTH_EPSILON,
    );
    if (high >= low) hidden.push([low, high]);
  }
  hidden.sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  const visible: [DepthPoint, DepthPoint][] = [];
  for (const [low, high] of hidden) {
    if (low > cursor)
      visible.push([interpolate(a, b, cursor), interpolate(a, b, low)]);
    cursor = Math.max(cursor, high);
    if (cursor >= 1) break;
  }
  if (cursor < 1) visible.push([interpolate(a, b, cursor), b]);
  return visible;
}
