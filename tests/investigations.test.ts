import { test } from "node:test";
import assert from "node:assert/strict";
import { INVESTIGATIONS } from "../archive/signal-lab/labs/investigations.ts";
import { parseLabSetup } from "../archive/signal-lab/labs/lab-setup.ts";
import { searchResponses } from "../src/domain/simulation/async-search.ts";
import { concurrentWrites } from "../src/domain/simulation/concurrent-writes.ts";
import { circuitBreaker } from "../src/domain/simulation/circuit-breaker.ts";
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
