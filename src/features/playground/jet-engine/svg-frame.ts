import {
  airPoint,
  enginePower,
  type ThrustMode,
} from "../../../domain/playground/jet-engine";
import {
  DepthIndex,
  visibleLine,
  visiblePolygons,
} from "../../../domain/playground/engine-depth";
import { engineFaces, projectDepth, staticTriangles, svgPath } from "./mesh";

type StillScene = {
  index: DepthIndex;
  faces: { shade: number; fill: string; edges: string }[];
};
const cache = new Map<ThrustMode, StillScene>();
const xy = (points: readonly (readonly [number, number, number])[]) =>
  points.map((p) => [p[0], p[1]] as const);
function stillScene(mode: ThrustMode) {
  const cached = cache.get(mode);
  if (cached) return cached;
  const faces = engineFaces(0, mode === "reverse" ? 1 : 0);
  const index = new DepthIndex([
    ...staticTriangles,
    ...faces.flatMap((face) => face.triangles),
  ]);
  const scene = {
    index,
    faces: faces.map((face) => ({
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
    })),
  };
  cache.set(mode, scene);
  return scene;
}
export const stillFaces = (mode: ThrustMode = "forward") =>
  stillScene(mode).faces;

export function stillAir(speed: number, mode: ThrustMode = "forward") {
  const { index } = stillScene(mode);
  const power = enginePower(speed);
  return Array.from(
    { length: speed === 0 ? 0 : Math.round(8 + speed * 0.2) },
    (_, route) => {
      const points = Array.from({ length: 65 }, (_, i) =>
        airPoint(route, i / 64, power, mode),
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
