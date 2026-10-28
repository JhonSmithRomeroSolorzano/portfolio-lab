import {
  bladePolygon,
  ENGINE_CENTER,
  ROTORS,
  reverserSolids,
  reverserVertices,
  type EnginePoint,
} from "../../src/domain/playground/jet-engine";
import {
  triangulate,
  type DepthPoint,
  type DepthTriangle,
} from "../../src/domain/playground/engine-depth";
import art from "../../src/features/playground/jet-engine/engine-art.json";
import { projectDepth } from "../../src/features/playground/jet-engine/mesh";

// Original allocating face construction from 48d05b2, including per-frame hubs.
type Face = {
  vertices: DepthPoint[];
  triangles: DepthTriangle[];
  boundaries: [boolean, boolean, boolean][];
  depth: number;
  shade: number;
};
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
    vertices: projected,
    triangles,
    boundaries,
    depth: projected.reduce((sum, p) => sum + p[2], 0) / projected.length,
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
    ),
    high = polygon.map(
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
let lastDeployment = NaN,
  cached: Face[] = [];
function reverserFaces(deployment: number) {
  if (deployment === lastDeployment) return cached;
  const faces: Face[] = [];
  for (const solid of reverserSolids(deployment)) {
    const vertices = reverserVertices(solid),
      count = solid.polygon.length;
    const surface = (indices: number[]) => {
      const points = indices.map((i) => vertices[i]),
        [a, b, c] = points;
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
  cached = faces;
  return faces;
}
export function referenceEngineFaces(angle: number, deployment = 0) {
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
