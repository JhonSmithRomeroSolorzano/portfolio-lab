import {
  enginePower,
  flowOpacity,
  writeAirPoint,
} from "../../../domain/playground/jet-engine";
import { projectDepthInto } from "./mesh";
import type { Ink } from "./raster";

type Point = [number, number, number];
type Trace = {
  points: [Point, Point, Point];
  color: Point;
  alpha: number;
  depth: number;
  width: number;
};

/** At most two modes × 22 slots per route. No temporal/pose approximation. */
export function createTracerPool(routes: number) {
  if (!Number.isInteger(routes) || routes < 1 || routes > 36)
    throw new RangeError("Invalid tracer route count.");
  const pool: Trace[] = [],
    ordered: Trace[] = [],
    world: Point = [0, 0, 0];
  return {
    get capacity() {
      return pool.length;
    },
    sample(
      power: ReturnType<typeof enginePower>,
      clock: number,
      still: boolean,
      reverseWeight: number,
      cool: Ink,
      hot: Ink,
    ): readonly Trace[] {
      let count = 0;
      for (let route = 0; route < routes; route++)
        for (
          let modeIndex = 0;
          modeIndex < (route % 3 === 0 ? 1 : 2);
          modeIndex++
        ) {
          const mode = modeIndex === 0 ? "forward" : "reverse";
          const weight =
            route % 3 === 0
              ? 1
              : modeIndex === 0
                ? 1 - reverseWeight
                : reverseWeight;
          if (weight <= 0.001) continue;
          for (let slot = 0; slot < 22; slot++) {
            const density = Math.max(0, Math.min(1, power.density - slot));
            if (!density) continue;
            const trace =
              pool[count] ??
              (pool[count] = {
                points: [
                  [0, 0, 0],
                  [0, 0, 0],
                  [0, 0, 0],
                ],
                color: [0, 0, 0],
                alpha: 0,
                depth: 0,
                width: 0,
              });
            const u =
              (((slot / 22 + route * 0.037 + clock * 0.085) % 1) + 1) % 1;
            writeAirPoint(world, route, u, power, mode);
            const heat =
              route % 3 === 0
                ? Math.max(0, Math.min(1, (world[0] + 8) / 32))
                : 0;
            for (let i = 0; i < 3; i++)
              trace.color[i] =
                heat === 0
                  ? cool[i]
                  : heat === 1
                    ? hot[i]
                    : Math.round(cool[i] + (hot[i] - cool[i]) * heat);
            const trail = (0.008 + power.throttle * 0.025) * (still ? 0.7 : 1);
            for (let i = 0; i < 3; i++)
              projectDepthInto(
                trace.points[i],
                writeAirPoint(
                  world,
                  route,
                  Math.max(0, u - trail * (1 - i / 2)),
                  power,
                  mode,
                ),
              );
            trace.alpha =
              density *
              flowOpacity(u) *
              (0.38 + power.throttle * 0.38) *
              weight;
            trace.depth = trace.points[2][2];
            trace.width = route % 3 === 0 ? 1.5 : 1.05;
            ordered[count++] = trace;
          }
        }
      ordered.length = count;
      ordered.sort((a, b) => a.depth - b.depth);
      return ordered;
    },
  };
}
