export type EnginePoint = readonly [number, number, number];
export type ThrustMode = "forward" | "reverse";
export const REVERSER = {
  start: 92,
  end: 120,
  inner: 57,
  outer: 61,
  panels: 30,
} as const;
export const ENGINE_CENTER = 102;
export const ROTORS = [
  { x: -148, radius: 55, blades: 18, ratio: 1 },
  { x: -98, radius: 25, blades: 10, ratio: 1.8 },
  { x: -74, radius: 24, blades: 10, ratio: 1.8 },
  { x: -50, radius: 23, blades: 10, ratio: 1.8 },
  { x: -26, radius: 22, blades: 10, ratio: 1.8 },
  { x: 78, radius: 24, blades: 10, ratio: 1.8 },
  { x: 99, radius: 23, blades: 10, ratio: 1.8 },
] as const;

export function engineSpeed(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("Invalid engine speed.");
  return Math.max(0, Math.min(100, value));
}

/** Normalized visual controls, not operating data or a thermodynamic model. */
export function enginePower(value: number) {
  const throttle = engineSpeed(value) / 100;
  return {
    throttle,
    rotation: throttle === 0 ? 0 : 0.7 + 8.8 * throttle ** 1.2,
    flow: throttle === 0 ? 0 : 0.3 + 2.8 * throttle ** 1.3,
    density: throttle === 0 ? 0 : 4 + 18 * throttle,
    reach: throttle === 0 ? 0 : 35 + 110 * throttle,
    heat: throttle === 0 ? 0 : 0.18 + 0.82 * throttle,
  };
}

export function approachSpool(current: number, target: number, dt: number) {
  const amount = 1 - Math.exp(-Math.max(0, Math.min(dt, 0.05)) / 0.38);
  const next = current + (target - current) * amount;
  return Math.abs(target - next) < 0.015 ? target : next;
}

const smooth = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
export function airPoint(
  route: number,
  progress: number,
  power: ReturnType<typeof enginePower>,
  mode: ThrustMode = "forward",
): EnginePoint {
  return writeAirPoint([0, 0, 0], route, progress, power, mode);
}

/** Explicit caller-owned buffer for renderers; the allocating API stays pure. */
export function writeAirPoint(
  out: [number, number, number],
  route: number,
  progress: number,
  power: ReturnType<typeof enginePower>,
  mode: ThrustMode = "forward",
): [number, number, number] {
  const u = Math.max(0, Math.min(1, progress));
  if (mode === "reverse" && route % 3 !== 0)
    return reverseAirPoint(out, route, u, power);
  const x = -225 + u * (370 + power.reach);
  const bypass = route % 3 !== 0;
  const angle = route * 2.399963229728653;
  const spread = bypass
    ? 0.84 + ((route * 17) % 11) / 70
    : 0.68 + ((route * 17) % 11) / 34;
  let radius: number;
  if (bypass) {
    radius = x < -144 ? 67 - 20 * smooth((x + 225) / 81) : 47;
    if (x > 145)
      radius *= 1 - 0.48 * smooth((x - 145) / Math.max(1, power.reach));
  } else {
    radius =
      x < -104
        ? 22 - 4 * smooth((x + 225) / 121)
        : x < -12
          ? 18 - 6 * smooth((x + 104) / 92)
          : x < 66
            ? 12 + 5 * Math.sin((Math.PI * (x + 12)) / 78)
            : x < 145
              ? 12 - 3 * smooth((x - 66) / 79)
              : 9 + 11 * smooth((x - 145) / Math.max(1, power.reach));
  }
  const twist =
    x < -144 ? 0 : (0.2 + power.throttle * 0.7) * smooth((x + 144) / 240);
  out[0] = x;
  out[1] = Math.cos(angle + twist) * radius * spread;
  out[2] = ENGINE_CENTER + Math.sin(angle + twist) * radius * spread;
  return out;
}

const cubic = (a: number, b: number, c: number, d: number, t: number) =>
  a * (1 - t) ** 3 +
  3 * b * t * (1 - t) ** 2 +
  3 * c * t * t * (1 - t) +
  d * t ** 3;

/** Cold-stream illustration: intake stays forward; only bypass flow turns out/front. */
function reverseAirPoint(
  out: [number, number, number],
  route: number,
  u: number,
  power: ReturnType<typeof enginePower>,
): [number, number, number] {
  if (u <= 0.62)
    return writeAirPoint(
      out,
      route,
      (315 * u) / 0.62 / (370 + power.reach),
      power,
    );
  const entry = writeAirPoint(out, route, 315 / (370 + power.reach), power);
  const angle = Math.atan2(entry[2] - ENGINE_CENTER, entry[1]);
  const spread = 0.84 + ((route * 17) % 11) / 70;
  let x: number, radius: number;
  if (u <= 0.78) {
    const t = (u - 0.62) / 0.16;
    x = cubic(90, 93, 96, 94, t);
    radius = cubic(47, 47, 58, 70, t) * spread;
  } else {
    const t = (u - 0.78) / 0.22;
    x = cubic(94, 74, 65 - power.reach, 40 - power.reach, t);
    radius = cubic(70, 88, 96, 96 + power.reach * 0.08, t) * spread;
  }
  out[0] = x;
  out[1] = Math.cos(angle) * radius;
  out[2] = ENGINE_CENTER + Math.sin(angle) * radius;
  return out;
}

export function approachReverser(current: number, target: number, dt: number) {
  const next =
    current +
    (target - current) *
      (1 - Math.exp(-Math.max(0, Math.min(dt, 0.05)) / 0.22));
  return Math.abs(target - next) < 0.001 ? target : next;
}
/** Bypass redirection appears only after the outer doors have opened clear. */
export function reverserFlowWeight(deployment: number) {
  return smooth((deployment - 0.85) / 0.15);
}

export type ReverserSolid = {
  name: string;
  kind: "door" | "blocker";
  frame: { o: EnginePoint; a: EnginePoint; u: EnginePoint; v: EnginePoint };
  polygon: readonly (readonly [number, number])[];
  start: number;
  end: number;
};
/** True rigid panels: each rotates around its own tangential hinge. */
export function reverserSolids(deployment: number): ReverserSolid[] {
  const d = Math.max(0, Math.min(1, deployment)),
    solids: ReverserSolid[] = [];
  for (let i = 0; i < REVERSER.panels; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 1.5) / REVERSER.panels,
      b = Math.PI / 2 + ((i + 1) * Math.PI * 1.5) / REVERSER.panels,
      mid = (a + b) / 2;
    const axis: EnginePoint = [0, -Math.sin(mid), Math.cos(mid)];
    for (const kind of ["door", "blocker"] as const) {
      const outer = kind === "door",
        ri = outer ? REVERSER.inner : REVERSER.inner - 1.2,
        ro = outer ? REVERSER.outer : REVERSER.inner;
      const inset = outer ? 0 : (b - a) * 0.25;
      const theta = outer ? -0.78 * d : 1.35 * smooth((d - 0.25) / 0.75);
      const hinge: EnginePoint = [
        REVERSER.end,
        ro * Math.cos(mid),
        ENGINE_CENTER + ro * Math.sin(mid),
      ];
      const rotate = (v: EnginePoint): EnginePoint => {
        const c = Math.cos(theta),
          s = Math.sin(theta),
          dot = v.reduce((sum, value, j) => sum + value * axis[j], 0);
        const cross = [
          axis[1] * v[2] - axis[2] * v[1],
          axis[2] * v[0] - axis[0] * v[2],
          axis[0] * v[1] - axis[1] * v[0],
        ];
        return v.map(
          (value, j) => value * c + cross[j] * s + axis[j] * dot * (1 - c),
        ) as [number, number, number];
      };
      const rotated = rotate([-hinge[0], -hinge[1], ENGINE_CENTER - hinge[2]]);
      solids.push({
        name: `reverser.${kind}.${i}`,
        kind,
        frame: {
          o: rotated.map((v, j) => v + hinge[j]) as [number, number, number],
          a: rotate([1, 0, 0]),
          u: rotate([0, 1, 0]),
          v: rotate([0, 0, 1]),
        },
        polygon: [
          [ri * Math.cos(a + inset), ri * Math.sin(a + inset)],
          [ro * Math.cos(a + inset), ro * Math.sin(a + inset)],
          [ro * Math.cos(b - inset), ro * Math.sin(b - inset)],
          [ri * Math.cos(b - inset), ri * Math.sin(b - inset)],
        ],
        start: outer ? REVERSER.start : REVERSER.start + 5,
        end: REVERSER.end,
      });
    }
  }
  return solids;
}

export function reverserVertices(solid: ReverserSolid): EnginePoint[] {
  return [solid.start, solid.end].flatMap((s) =>
    solid.polygon.map(
      ([u, v]) =>
        solid.frame.o.map(
          (value, i) =>
            value +
            solid.frame.a[i] * s +
            solid.frame.u[i] * u +
            solid.frame.v[i] * v,
        ) as [number, number, number],
    ),
  );
}

export function flowOpacity(progress: number) {
  return smooth(progress / 0.075) * (1 - smooth((progress - 0.82) / 0.18));
}

/** A swept blade in the plane perpendicular to the shaft; angle is continuous. */
export function bladePolygon(
  radius: number,
  angle: number,
): readonly (readonly [number, number])[] {
  return [
    [9, 0],
    [radius * 0.58, 0.08],
    [radius, 0.28],
    [radius, 0.47],
    [radius * 0.55, 0.4],
    [9, 0.31],
  ].map(
    ([r, offset]) =>
      [Math.cos(angle + offset) * r, Math.sin(angle + offset) * r] as const,
  );
}
