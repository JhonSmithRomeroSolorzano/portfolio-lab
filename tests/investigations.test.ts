import { test } from "node:test";
import assert from "node:assert/strict";
import { INVESTIGATIONS } from "../src/labs/investigations.ts";
import { parseLabSetup } from "../src/labs/lab-setup.ts";
import { searchResponses } from "../src/labs/async-search.ts";
import { concurrentWrites } from "../src/labs/concurrent-writes.ts";
import { circuitBreaker } from "../src/labs/circuit-breaker.ts";
test("guide presets are valid links and their stated outcomes follow the models", () => {
  for (const guide of INVESTIGATIONS)
    for (const step of guide.steps)
      assert.deepEqual(parseLabSetup(JSON.stringify(step.setup)), step.setup);
  assert.equal(searchResponses(800, 100, "every").visible, "r");
  assert.equal(searchResponses(800, 100, "latest").visible, "react");
  assert.deepEqual(
    ["overwrite", "reject", "retry"].map(
      (p) => concurrentWrites(1, 5, p as "overwrite").value,
    ),
    [15, 11, 16],
  );
  assert.ok(
    circuitBreaker(3, 500, 800).rows.some(
      (r) =>
        r.at === 900 && r.before === "half-open" && r.outcome === "success",
    ),
  );
});
