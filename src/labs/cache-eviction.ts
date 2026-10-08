import { modelInteger } from "./model-input";
export const CACHE_KEYS = [
  "A",
  "B",
  "C",
  "A",
  "D",
  "B",
  "E",
  "A",
  "C",
  "D",
  "E",
  "A",
] as const;
export type EvictionPolicy = "fifo" | "lru";
export function evictCache(capacity: number, policy: EvictionPolicy) {
  modelInteger(capacity, 2, 5);
  if (!["fifo", "lru"].includes(policy))
    throw new RangeError("Unknown eviction policy.");
  const cache: string[] = [];
  const rows = CACHE_KEYS.map((key, index) => {
    const found = cache.indexOf(key),
      hit = found !== -1;
    let evicted: string | null = null;
    if (hit && policy === "lru") cache.splice(found, 1);
    if (!hit && cache.length === capacity) evicted = cache.shift()!;
    if (!hit || policy === "lru") cache.push(key);
    return { index, key, hit, evicted, cache: [...cache] };
  });
  return {
    rows,
    hits: rows.filter((r) => r.hit).length,
    misses: rows.filter((r) => !r.hit).length,
  };
}
