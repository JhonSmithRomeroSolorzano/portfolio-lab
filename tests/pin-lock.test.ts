import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { LOCKS, lockState, pinLevel } from "../src/domain/playground/pin-lock";
import art from "../src/features/playground/pin-lock/lock-art.json";

test("each authored lock has exactly one opening across all 7776 combinations", () => {
  for (const lock of LOCKS) {
    assert.equal(lockState(lock.cuts, lock.start).canOpen, false);
    let openings = 0;
    for (let code = 0; code < 7776; code++) {
      const levels = Array.from(
        { length: 5 },
        (_, index) => Math.floor(code / 6 ** index) % 6,
      );
      const state = lockState(lock.cuts, levels);
      assert.equal(state.matched + state.blockers.length, 5);
      assert.equal(state.canOpen, state.matched === 5);
      for (const pin of state.blockers)
        assert.notEqual(levels[pin - 1], lock.cuts[pin - 1]);
      if (state.canOpen) {
        openings++;
        assert.deepEqual(levels, [...lock.cuts]);
      }
    }
    assert.equal(openings, 1);
  }
});

test("pin controls clamp and round without accepting invalid lock values", () => {
  assert.equal(pinLevel(-2), 0);
  assert.equal(pinLevel(99), 5);
  assert.equal(pinLevel(2.7), 3);
  assert.throws(() => pinLevel(NaN), RangeError);
  assert.throws(() => lockState([1], [1]), RangeError);
  assert.throws(() => lockState(LOCKS[0].cuts, [0, 0, 0, 0, 6]), RangeError);
  const levels = [...LOCKS[0].cuts];
  lockState(LOCKS[0].cuts, levels);
  assert.deepEqual(levels, LOCKS[0].cuts);
});

test("lock geometry reproduces from Anatomy and shares the domain cut patterns", () => {
  execFileSync(
    process.execPath,
    ["--import", "tsx", "scripts/build-pin-lock.mjs", "--check"],
    { encoding: "utf8" },
  );
  assert.deepEqual(
    art.cuts,
    LOCKS.map((lock) => [...lock.cuts]),
  );
  assert.ok(art.parts >= 40 && art.parts <= 80);
  assert.equal(art.lifters.length, 6);
  assert.doesNotMatch(JSON.stringify(art), /NaN|Infinity|<script/);
  for (let pattern = 0; pattern < LOCKS.length; pattern++)
    for (let pin = 0; pin < 5; pin++) {
      assert.equal(art.springs[pattern][pin].length, 6);
      for (let level = 0; level < 6; level++) {
        const split = 78 + (level - LOCKS[pattern].cuts[pin]) * 8;
        assert.ok(split > 16 && split + 18 < 142);
        assert.ok(art.springs[pattern][pin][level].startsWith("M"));
      }
    }
});
