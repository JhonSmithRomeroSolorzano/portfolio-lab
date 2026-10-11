import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LAB_SETTINGS,
  parseLabSetup,
  setupFromSearch,
  setupUrl,
} from "../archive/signal-lab/labs/lab-setup.ts";
import type { SetupId } from "../archive/signal-lab/labs/lab-setup.ts";
test("all independent setups round trip without serializing results", () => {
  for (const lab of Object.keys(DEFAULT_LAB_SETTINGS) as SetupId[]) {
    const url = new URL(
      setupUrl(
        `https://example.test/?lab=${lab}&traffic=200#lab`,
        lab,
        DEFAULT_LAB_SETTINGS,
      ),
    );
    assert.deepEqual(setupFromSearch(url.search), {
      setup: { version: 1, lab, settings: DEFAULT_LAB_SETTINGS[lab] },
      invalid: false,
    });
    assert.equal(url.searchParams.get("traffic"), "200");
  }
});
test("malformed, unsupported, excessive, partial, and mismatched setups are rejected atomically", () => {
  const valid = {
    version: 1,
    lab: "writes",
    settings: DEFAULT_LAB_SETTINGS.writes,
  };
  for (const value of [
    { ...valid, version: 2 },
    { ...valid, lab: "__proto__" },
    { ...valid, extra: 1 },
    { ...valid, settings: { ...valid.settings, firstDelta: -6 } },
    { ...valid, settings: { ...valid.settings, policy: "danger" } },
    { ...valid, settings: { firstDelta: 1 } },
    { ...valid, settings: { ...valid.settings, secondDelta: 1.5 } },
  ])
    assert.equal(parseLabSetup(JSON.stringify(value)), null);
  assert.equal(parseLabSetup(" ".repeat(1025)), null);
  assert.equal(parseLabSetup("{"), null);
  const params = new URLSearchParams({
    lab: "search",
    setup: JSON.stringify(valid),
  });
  assert.deepEqual(setupFromSearch(params.toString()), {
    setup: null,
    invalid: true,
  });
  params.set("lab", "writes");
  params.append("setup", JSON.stringify(valid));
  assert.equal(setupFromSearch(params.toString()).invalid, true);
});
