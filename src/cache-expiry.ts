export type CachePolicy = "ttl" | "invalidate" | "swr";
export interface CacheRead {
  second: number;
  source: "cache" | "database";
  originVersion: number;
  returnedVersion: number;
  stale: boolean;
  expiresAt: number;
  originReads: number;
  refreshing: boolean;
}
/** Reads t=0..20; update before t=5. Background fetches finish before the next read. */
export function cacheTimeline(
  ttlSeconds: number,
  policy: CachePolicy = "ttl",
): CacheRead[] {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 12)
    throw new RangeError("TTL must be 1 to 12 seconds.");
  if (!["ttl", "invalidate", "swr"].includes(policy))
    throw new RangeError("Unknown cache policy.");
  let cachedVersion = 0,
    expiresAt = -1;
  let refresh: { version: number; readyAt: number } | null = null;
  return Array.from({ length: 21 }, (_, second) => {
    if (refresh && second >= refresh.readyAt) {
      cachedVersion = refresh.version;
      expiresAt = second + ttlSeconds;
      refresh = null;
    }
    const originVersion = second < 5 ? 1 : 2;
    if (policy === "invalidate" && second === 5) expiresAt = -1;
    const hit = cachedVersion !== 0 && (second < expiresAt || policy === "swr");
    let originReads = 0;
    if (!hit) {
      cachedVersion = originVersion;
      expiresAt = second + ttlSeconds;
      originReads = 1;
    } else if (policy === "swr" && second >= expiresAt && !refresh) {
      refresh = { version: originVersion, readyAt: second + 1 };
      originReads = 1;
    }
    return {
      second,
      source: hit ? "cache" : "database",
      originVersion,
      returnedVersion: cachedVersion,
      stale: cachedVersion !== originVersion,
      expiresAt,
      originReads,
      refreshing: refresh !== null,
    };
  });
}
