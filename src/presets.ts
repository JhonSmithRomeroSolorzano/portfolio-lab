import type { Scenario } from "./simulation";

export const PRESETS: {
  name: string;
  description: string;
  scenario: Scenario;
}[] = [
  {
    name: "Cache rescue",
    description:
      "A busy system with repeated reads. Turn the cache off to expose database pressure.",
    scenario: {
      requestsPerSecond: 300,
      cacheEnabled: true,
      database: "normal",
    },
  },
  {
    name: "Slow datastore",
    description:
      "Normal traffic meets a slow database. Compare the effect of caching.",
    scenario: { requestsPerSecond: 120, cacheEnabled: false, database: "slow" },
  },
  {
    name: "Partial outage",
    description:
      "The database is offline. Discover which requests the warm cache can still serve.",
    scenario: {
      requestsPerSecond: 200,
      cacheEnabled: true,
      database: "offline",
    },
  },
];
