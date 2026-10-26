import type {
  EnginePoint,
  ThrustMode,
  enginePower,
} from "../../src/domain/playground/jet-engine";

// Allocating formulas retained from 782accc. Run the reference on the current
// platform: transcendental results are not a portable raw-byte golden digest.
const center = 102;
const smooth = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
export function referenceAirPoint(
  route: number,
  progress: number,
  power: ReturnType<typeof enginePower>,
  mode: ThrustMode = "forward",
): EnginePoint {
  const u = Math.max(0, Math.min(1, progress));
  if (mode === "reverse" && route % 3 !== 0) {
    const entry = referenceAirPoint(route, 315 / (370 + power.reach), power);
    if (u <= 0.62)
      return referenceAirPoint(
        route,
        (315 * u) / 0.62 / (370 + power.reach),
        power,
      );
    const angle = Math.atan2(entry[2] - center, entry[1]),
      spread = 0.84 + ((route * 17) % 11) / 70;
    const cubic = (a: number, b: number, c: number, d: number, t: number) =>
      a * (1 - t) ** 3 +
      3 * b * t * (1 - t) ** 2 +
      3 * c * t * t * (1 - t) +
      d * t ** 3;
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
    return [x, Math.cos(angle) * radius, center + Math.sin(angle) * radius];
  }
  const x = -225 + u * (370 + power.reach),
    bypass = route % 3 !== 0,
    angle = route * 2.399963229728653;
  const spread = bypass
    ? 0.84 + ((route * 17) % 11) / 70
    : 0.68 + ((route * 17) % 11) / 34;
  let radius: number;
  if (bypass) {
    radius = x < -144 ? 67 - 20 * smooth((x + 225) / 81) : 47;
    if (x > 145)
      radius *= 1 - 0.48 * smooth((x - 145) / Math.max(1, power.reach));
  } else
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
  const twist =
    x < -144 ? 0 : (0.2 + power.throttle * 0.7) * smooth((x + 144) / 240);
  return [
    x,
    Math.cos(angle + twist) * radius * spread,
    center + Math.sin(angle + twist) * radius * spread,
  ];
}
