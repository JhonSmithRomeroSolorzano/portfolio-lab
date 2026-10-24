import {
  bladePolygon,
  ENGINE_CENTER,
  ROTORS,
  reverserSolids,
  reverserVertices,
  type EnginePoint,
} from "../../../domain/playground/jet-engine";
import art from "./engine-art.json";
import geometry from "./engine-depth.json";
import {
  decodeDepthMesh,
  triangulate,
  type DepthPoint,
  type DepthTriangle,
} from "../../../domain/playground/engine-depth";

export type Face = {
  points: [number, number][];
  vertices: DepthPoint[];
  triangles: DepthTriangle[];
  boundaries: readonly (readonly [boolean, boolean, boolean])[];
  depth: number;
  shade: number;
};
export const staticTriangles = decodeDepthMesh(geometry);
export function project(point: EnginePoint): [number, number] {
  return [
    art.origin[0] +
      point.reduce((sum, value, i) => sum + value * art.axes[i][0], 0),
    art.origin[1] +
      point.reduce((sum, value, i) => sum + value * art.axes[i][1], 0),
  ];
}
export function depth(point: EnginePoint) {
  return point.reduce((sum, value, i) => sum + value * art.camera.view[i], 0);
}
export function projectDepth(point: EnginePoint): DepthPoint {
  return [...project(point), depth(point)];
}
function face(vertices: EnginePoint[], normal: EnginePoint, out: Face[]) {
  const length = Math.hypot(...normal) || 1;
  if (normal.reduce((sum, v, i) => sum + v * art.camera.view[i], 0) <= 0)
    return;
  const score = normal.reduce(
    (sum, v, i) => sum + (v / length) * art.camera.light[i],
    0,
  );
  const shade = [0, 0.2, 0.42, 0.62].filter((value) => score >= value).length;
  const projected = vertices.map(projectDepth),
    triangles = triangulate(projected);
  const boundaries = triangles.map(
    (t) =>
      t.vertices.map((a, i) => {
        const b = t.vertices[(i + 1) % 3];
        return projected.some(
          (p, j) =>
            (p === a && projected[(j + 1) % projected.length] === b) ||
            (p === b && projected[(j + 1) % projected.length] === a),
        );
      }) as [boolean, boolean, boolean],
  );
  out.push({
    points: projected.map((p) => [p[0], p[1]]),
    vertices: projected,
    triangles,
    boundaries,
    depth: vertices.reduce((sum, p) => sum + depth(p), 0) / vertices.length,
    shade,
  });
}
function prism(
  x: number,
  polygon: readonly (readonly [number, number])[],
  thickness: number,
  out: Face[],
) {
  const low = polygon.map(
    ([y, z]) => [x - thickness / 2, y, ENGINE_CENTER + z] as const,
  );
  const high = polygon.map(
    ([y, z]) => [x + thickness / 2, y, ENGINE_CENTER + z] as const,
  );
  face(low, [-1, 0, 0], out);
  face(high, [1, 0, 0], out);
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    face(
      [low[i], low[j], high[j], high[i]],
      [0, polygon[j][1] - polygon[i][1], polygon[i][0] - polygon[j][0]],
      out,
    );
  }
}
let lastDeployment = NaN;
let lastReverserFaces: Face[] = [];
export function reverserFaces(deployment: number): Face[] {
  if (deployment === lastDeployment) return lastReverserFaces;
  const faces: Face[] = [];
  for (const solid of reverserSolids(deployment)) {
    const vertices = reverserVertices(solid),
      count = solid.polygon.length;
    const surface = (indices: number[]) => {
      const points = indices.map((i) => vertices[i]),
        a = points[0],
        b = points[1],
        c = points[2];
      const ab = b.map((v, i) => v - a[i]),
        ac = c.map((v, i) => v - a[i]);
      face(
        points,
        [
          ab[1] * ac[2] - ab[2] * ac[1],
          ab[2] * ac[0] - ab[0] * ac[2],
          ab[0] * ac[1] - ab[1] * ac[0],
        ],
        faces,
      );
    };
    surface([3, 2, 1, 0]);
    surface([4, 5, 6, 7]);
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      surface([i, j, j + count, i + count]);
    }
  }
  lastDeployment = deployment;
  lastReverserFaces = faces;
  return faces;
}
export function engineFaces(angle: number, deployment = 0): Face[] {
  const faces: Face[] = [];
  for (const rotor of ROTORS) {
    for (let i = 0; i < rotor.blades; i++)
      prism(
        rotor.x,
        bladePolygon(
          rotor.radius,
          angle * rotor.ratio + (i * Math.PI * 2) / rotor.blades,
        ),
        2,
        faces,
      );
    const hub = Array.from(
      { length: 16 },
      (_, i) =>
        [
          Math.cos((i * Math.PI) / 8) * 9,
          Math.sin((i * Math.PI) / 8) * 9,
        ] as const,
    );
    prism(rotor.x, hub, 4, faces);
  }
  return [...faces, ...reverserFaces(deployment)].sort(
    (a, b) => a.depth - b.depth,
  );
}
export function svgPath(points: readonly (readonly [number, number])[]) {
  return points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join("");
}
