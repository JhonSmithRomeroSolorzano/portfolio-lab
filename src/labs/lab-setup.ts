import type { LabId } from "../lab-catalog";
export interface LabSettings {
  search: { oldDelay: number; newestDelay: number; policy: "every" | "latest" };
  events: {
    pattern: "burst" | "steady";
    delay: number;
    policy: "every" | "debounce" | "throttle";
  };
  circuit: { threshold: number; cooldown: number; recovery: number };
  "rate-limit": { limit: number; policy: "fixed" | "bucket" };
  eviction: { capacity: number; policy: "fifo" | "lru" };
  writes: {
    firstDelta: number;
    secondDelta: number;
    policy: "overwrite" | "reject" | "retry";
  };
}
export type SetupId = keyof LabSettings;
export type LabSetup = {
  [K in SetupId]: { version: 1; lab: K; settings: LabSettings[K] };
}[SetupId];
export const DEFAULT_LAB_SETTINGS: LabSettings = {
  search: { oldDelay: 800, newestDelay: 100, policy: "every" },
  events: { pattern: "burst", delay: 200, policy: "debounce" },
  circuit: { threshold: 3, cooldown: 500, recovery: 800 },
  "rate-limit": { limit: 4, policy: "fixed" },
  eviction: { capacity: 3, policy: "fifo" },
  writes: { firstDelta: 1, secondDelta: 5, policy: "overwrite" },
};
export function hasSetup(id: LabId): id is SetupId {
  return Object.hasOwn(DEFAULT_LAB_SETTINGS, id);
}
type Rule = readonly string[] | { min: number; max: number; step?: number };
const schema: { [K in SetupId]: Record<keyof LabSettings[K], Rule> } = {
  search: {
    oldDelay: { min: 50, max: 1000, step: 50 },
    newestDelay: { min: 50, max: 1000, step: 50 },
    policy: ["every", "latest"],
  },
  events: {
    pattern: ["burst", "steady"],
    delay: { min: 50, max: 500, step: 50 },
    policy: ["every", "debounce", "throttle"],
  },
  circuit: {
    threshold: { min: 1, max: 5 },
    cooldown: { min: 100, max: 700, step: 100 },
    recovery: { min: 400, max: 1200, step: 100 },
  },
  "rate-limit": { limit: { min: 1, max: 10 }, policy: ["fixed", "bucket"] },
  eviction: { capacity: { min: 2, max: 5 }, policy: ["fifo", "lru"] },
  writes: {
    firstDelta: { min: -5, max: 10 },
    secondDelta: { min: -5, max: 10 },
    policy: ["overwrite", "reject", "retry"],
  },
};
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseLabSetup(text: string): LabSetup | null {
  if (text.length > 1024) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (
      !record(value) ||
      Object.keys(value).sort().join() !== "lab,settings,version" ||
      value.version !== 1 ||
      typeof value.lab !== "string" ||
      !Object.hasOwn(schema, value.lab) ||
      !record(value.settings)
    )
      return null;
    const rules = schema[value.lab as SetupId],
      settings = value.settings;
    if (
      Object.keys(settings).sort().join() !== Object.keys(rules).sort().join()
    )
      return null;
    for (const [key, rule] of Object.entries(rules)) {
      const field = settings[key];
      if (Array.isArray(rule)) {
        if (typeof field !== "string" || !rule.includes(field)) return null;
      } else {
        const range = rule as { min: number; max: number; step?: number };
        if (
          typeof field !== "number" ||
          !Number.isInteger(field) ||
          field < range.min ||
          field > range.max ||
          (field - range.min) % (range.step ?? 1)
        )
          return null;
      }
    }
    return value as unknown as LabSetup;
  } catch {
    return null;
  }
}
export function setupFromSearch(search: string) {
  const params = new URLSearchParams(search);
  if (!params.has("setup")) return { setup: null, invalid: false };
  const setup =
    params.getAll("setup").length === 1
      ? parseLabSetup(params.get("setup")!)
      : null;
  const valid =
    setup &&
    params.getAll("lab").length === 1 &&
    params.get("lab") === setup.lab;
  return { setup: valid ? setup : null, invalid: !valid };
}
export function setupUrl(current: string, id: LabId, settings: LabSettings) {
  const url = new URL(current);
  url.searchParams.delete("setup");
  if (hasSetup(id))
    url.searchParams.set(
      "setup",
      JSON.stringify({ version: 1, lab: id, settings: settings[id] }),
    );
  return url.toString();
}
