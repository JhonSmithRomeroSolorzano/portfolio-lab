export interface CacheRead {
  second: number;
  source: "cache" | "database";
  originVersion: number;
  returnedVersion: number;
  stale: boolean;
  expiresAt: number;
}
/** One read per second, t=0..20. The origin changes just before the t=5 read. */
export function cacheTimeline(ttlSeconds: number): CacheRead[] {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 12)
    throw new RangeError("TTL must be 1 to 12 seconds.");
  let cachedVersion = 0;
  let expiresAt = -1;
  return Array.from({ length: 21 }, (_, second) => {
    const originVersion = second < 5 ? 1 : 2;
    const hit = second < expiresAt;
    if (!hit) {
      cachedVersion = originVersion;
      expiresAt = second + ttlSeconds;
    }
    return {
      second,
      source: hit ? "cache" : "database",
      originVersion,
      returnedVersion: cachedVersion,
      stale: cachedVersion !== originVersion,
      expiresAt,
    };
  });
}
