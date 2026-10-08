import { cacheTimeline } from "./cache-expiry";
import type { CachePolicy } from "./cache-expiry";
export function cacheTimelineCsv(ttl: number, policy: CachePolicy) {
  const header =
    "policy,ttl_seconds,second,source,origin_version,returned_version,stale,expires_at,origin_fetches,refresh_pending";
  return (
    [
      header,
      ...cacheTimeline(ttl, policy).map((r) =>
        [
          policy,
          ttl,
          r.second,
          r.source,
          r.originVersion,
          r.returnedVersion,
          r.stale,
          r.expiresAt,
          r.originReads,
          r.refreshing,
        ].join(","),
      ),
    ].join("\n") + "\n"
  );
}
