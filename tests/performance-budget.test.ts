import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAssetBudget,
  assertPerformanceBudget,
  assetLimits,
} from "../scripts/performance-budget";

test("asset gates reject growth and missing measurements", () => {
  assert.doesNotThrow(() => assertAssetBudget({ ...assetLimits }));
  for (const key of Object.keys(assetLimits))
    assert.throws(() => assertAssetBudget({ ...assetLimits, [key]: Infinity }));
  assert.throws(() =>
    assertAssetBudget({ ...assetLimits, allJsGzip: assetLimits.allJsGzip + 1 }),
  );
});
test("performance gate tolerates one noisy run but rejects sustained regressions", () => {
  const good = { lcp: 1500, cls: 0.02, tbt: 50 };
  const slow = { lcp: 9000, cls: 0.5, tbt: 1000 };
  assert.deepEqual(assertPerformanceBudget([good, slow, good]), good);
  assert.throws(() => assertPerformanceBudget([slow, good, slow]));
  assert.throws(() => assertPerformanceBudget([good]));
  assert.throws(() =>
    assertPerformanceBudget([good, { ...good, lcp: NaN }, good]),
  );
});
