import { airPoint, enginePower } from "../../../domain/playground/jet-engine";
import {
  DepthIndex,
  visibleLine,
  visiblePolygons,
} from "../../../domain/playground/engine-depth";
import { engineFaces, projectDepth, staticTriangles, svgPath } from "./mesh";

let cachedIndex: DepthIndex | undefined;
let cachedFaces: { shade: number; fill: string; edges: string }[] | undefined;
const xy = (points: readonly (readonly [number, number, number])[]) =>
  points.map((p) => [p[0], p[1]] as const);
export function stillFaces() {
  if (cachedFaces) return cachedFaces;
  const faces = engineFaces(0);
  const index = (cachedIndex = new DepthIndex([
    ...staticTriangles,
    ...faces.flatMap((face) => face.triangles),
  ]));
  return (cachedFaces = faces.map((face) => ({
    shade: face.shade,
    fill: face.triangles
      .flatMap((t) => visiblePolygons(t, index))
      .map((polygon) => svgPath(xy(polygon)) + "Z")
      .join(""),
    edges: face.vertices
      .flatMap((p, i) =>
        visibleLine(p, face.vertices[(i + 1) % face.vertices.length], index),
      )
      .map((segment) => svgPath(xy(segment)))
      .join(""),
  })));
}

export function stillAir(speed: number) {
  stillFaces();
  const index = cachedIndex!;
  const power = enginePower(speed);
  return Array.from(
    { length: speed === 0 ? 0 : Math.round(8 + speed * 0.2) },
    (_, route) => {
      const points = Array.from({ length: 25 }, (_, i) =>
        airPoint(route, i / 24, power),
      );
      const cool: string[] = [],
        hot: string[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const segments = visibleLine(
          projectDepth(points[i]),
          projectDepth(points[i + 1]),
          index,
          0.9,
        );
        const paths = route % 3 === 0 && points[i][0] > -8 ? hot : cool;
        paths.push(...segments.map((segment) => svgPath(xy(segment))));
      }
      return { route, cool: cool.join(""), hot: hot.join("") };
    },
  );
}
