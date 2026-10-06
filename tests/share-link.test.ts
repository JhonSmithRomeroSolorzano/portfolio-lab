import { test } from "node:test";
import assert from "node:assert/strict";
import { copyLink, shareScenarioUrl } from "../src/share-link.ts";
import { scenarioFromSearch } from "../src/scenario-url.ts";
import { DEFAULT_SCENARIO } from "../src/simulation.ts";

test("shared links retain the exact experiment but discard unrelated query data", () => {
  const scenario = {
    requestsPerSecond: 300,
    cacheEnabled: false,
    database: "slow" as const,
  };
  const url = new URL(
    shareScenarioUrl(
      "https://example.com/portfolio-lab/?session=private&traffic=20&utm_source=test#about",
      scenario,
    ),
  );
  assert.equal(url.origin, "https://example.com");
  assert.equal(url.pathname, "/portfolio-lab/");
  assert.equal(url.hash, "#lab");
  assert.deepEqual(
    [...url.searchParams.keys()],
    ["traffic", "cache", "database"],
  );
  assert.deepEqual(scenarioFromSearch(url.search), scenario);
});

test("default experiments share a clean link to the lab", () => {
  assert.equal(
    shareScenarioUrl(
      "https://example.com/?traffic=600#about",
      DEFAULT_SCENARIO,
    ),
    "https://example.com/#lab",
  );
});

test("copy reports success only after the clipboard write completes", async () => {
  let copied = "";
  const result = await copyLink("https://example.com/#lab", async (text) => {
    copied = text;
  });
  assert.equal(copied, "https://example.com/#lab");
  assert.deepEqual(result, { status: "copied" });
});

test("denied or unavailable clipboard access returns a manual link", async () => {
  const url = "https://example.com/?cache=off#lab";
  assert.deepEqual(await copyLink(url), { status: "manual", url });
  assert.deepEqual(
    await copyLink(url, async () => {
      throw new Error("Denied");
    }),
    { status: "manual", url },
  );
});
