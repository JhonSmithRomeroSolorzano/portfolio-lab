export const assetLimits = {
  entryJsGzip: 102400,
  allJsGzip: 143360,
  cssGzip: 16384,
  htmlGzip: 20480,
  fonts: 92160,
  portrait: 40960,
} as const;
export type AssetSizes = Record<keyof typeof assetLimits, number>;
export function assertAssetBudget(sizes: AssetSizes) {
  for (const [key, limit] of Object.entries(assetLimits)) {
    const size = sizes[key as keyof AssetSizes];
    if (!Number.isFinite(size) || size < 0 || size > limit)
      throw new Error(
        `${key}: ${size} bytes exceeds the ${limit}-byte budget or is invalid.`,
      );
  }
}
export type PerformanceSample = { lcp: number; cls: number; tbt: number };
export function assertPerformanceBudget(samples: PerformanceSample[]) {
  if (samples.length !== 3)
    throw new Error("Three performance samples are required.");
  const limits: PerformanceSample = { lcp: 4000, cls: 0.1, tbt: 350 };
  const medians = { lcp: 0, cls: 0, tbt: 0 };
  for (const key of ["lcp", "cls", "tbt"] as const) {
    const values = samples.map((sample) => sample[key]);
    if (values.some((value) => !Number.isFinite(value) || value < 0))
      throw new Error(`Missing or invalid ${key} measurement.`);
    medians[key] = values.sort((a, b) => a - b)[1];
    if (medians[key] > limits[key])
      throw new Error(`Median ${key} ${medians[key]} exceeds ${limits[key]}.`);
  }
  return medians;
}
