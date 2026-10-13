import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyRecord,
  recordCompletion,
} from "../src/domain/playground/puzzle-records";

test("personal bests keep assistance categories separate and only improve", () => {
  const first = recordCompletion(emptyRecord(), 20, false);
  assert.deepEqual(first, { unassisted: 20, assisted: null });
  const helped = recordCompletion(first, 10, true);
  assert.deepEqual(helped, { unassisted: 20, assisted: 10 });
  assert.deepEqual(recordCompletion(helped, 25, false), helped);
  assert.deepEqual(recordCompletion(helped, 18, false), {
    unassisted: 18,
    assisted: 10,
  });
  assert.deepEqual(recordCompletion(helped, null, false), helped);
  assert.throws(() => recordCompletion(helped, -1, false));
});
