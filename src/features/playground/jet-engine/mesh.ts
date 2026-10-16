import {
  bladePolygon,
  ENGINE_CENTER,
  ROTORS,
  type EnginePoint,
} from "../../../domain/playground/jet-engine";
import art from "./engine-art.json";

export type Face = { points: [number, number][]; depth: number; shade: number };
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
function face(vertices: EnginePoint[], normal: EnginePoint, out: Face[]) {
  const length = Math.hypot(...normal) || 1;
  if (normal.reduce((sum, v, i) => sum + v * art.camera.view[i], 0) <= 0)
    return;
  const score = normal.reduce(
    (sum, v, i) => sum + (v / length) * art.camera.light[i],
    0,
  );
  const shade = [0, 0.2, 0.42, 0.62].filter((value) => score >= value).length;
  out.push({
    points: vertices.map(project),
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
export function engineFaces(angle: number): Face[] {
  const faces: Face[] = [];
  for (const guide of art.guideMeshes)
    prism(guide.x, guide.polygon as [number, number][], 2, faces);
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
  return faces.sort((a, b) => a.depth - b.depth);
}
export function svgPath(points: readonly (readonly [number, number])[]) {
  return points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join("");
}
