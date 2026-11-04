export const NAME_RAIN_DURATION = 4600;

export function nameRainSeed(index: number) {
  const value = Math.sin(index * 127.1 + 17.7) * 43758.5453;
  return value - Math.floor(value);
}

/** A few isolated highlights first, then increasingly many together. */
export function nameRainReveal(seed: number, milliseconds: number) {
  const delay = 200 + seed ** 0.38 * 3700;
  const t = Math.max(0, Math.min(1, (milliseconds - delay) / 500));
  return t * t * (3 - 2 * t);
}

/** Average alpha in a rain tile, using a precomputed summed-area stencil. */
export function nameRainCoverage(
  integral: Uint32Array,
  width: number,
  height: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  const l = Math.max(0, Math.min(width, Math.floor(left)));
  const t = Math.max(0, Math.min(height, Math.floor(top)));
  const r = Math.max(0, Math.min(width, Math.ceil(right)));
  const b = Math.max(0, Math.min(height, Math.ceil(bottom)));
  if (r <= l || b <= t) return 0;
  const stride = width + 1;
  const sum =
    integral[b * stride + r] -
    integral[t * stride + r] -
    integral[b * stride + l] +
    integral[t * stride + l];
  return sum / ((r - l) * (b - t) * 255);
}
