export type EnginePoint = readonly [number, number, number];
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
): EnginePoint {
  const u = Math.max(0, Math.min(1, progress));
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
  return [
    x,
    Math.cos(angle + twist) * radius * spread,
    ENGINE_CENTER + Math.sin(angle + twist) * radius * spread,
  ];
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
