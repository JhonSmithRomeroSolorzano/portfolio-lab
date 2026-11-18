import assert from "node:assert/strict";
import { Writable } from "node:stream";
import test from "node:test";
import { iterateBatch, MAX_BATCH_BYTES, replayBatch } from "../scripts/batch";
import { writeLines } from "../scripts/write-lines";
import {
  DEFAULT_SCENARIO,
  simulate,
} from "../src/domain/simulation/simulation";

test("batch iteration parses on demand and closing it leaves later rows untouched", (t) => {
  const first = JSON.stringify(DEFAULT_SCENARIO);
  const last = JSON.stringify({ ...DEFAULT_SCENARIO, database: "slow" });
  const parse = t.mock.method(JSON, "parse");
  const rows = iterateBatch(`${first}\n{\n${last}`);
  assert.equal(
    parse.mock.callCount(),
    0,
    "Creating an iterator must not parse the batch",
  );
  const row = rows.next();
  assert.equal(row.done, false);
  assert.equal(row.value.line, 1);
  assert.equal(parse.mock.callCount(), 1);
  assert.equal(rows.next().value.error, "Invalid JSON.");
  assert.equal(parse.mock.callCount(), 2);
  rows.return?.();
  assert.equal(rows.next().done, true);
  assert.equal(
    parse.mock.callCount(),
    2,
    "Closing must not parse the final row",
  );
});

test("batch iterator and array facade preserve physical lines, order and errors", () => {
  const good = JSON.stringify(DEFAULT_SCENARIO);
  const input = ` \n${good}\r\n{\n{}\n\t\r\n${good}\r`;
  const expected = [
    {
      line: 2,
      ok: true,
      scenario: DEFAULT_SCENARIO,
      result: simulate(DEFAULT_SCENARIO),
    },
    { line: 3, ok: false, error: "Invalid JSON." },
    { line: 4, ok: false, error: "Invalid scenario." },
    {
      line: 6,
      ok: true,
      scenario: DEFAULT_SCENARIO,
      result: simulate(DEFAULT_SCENARIO),
    },
  ];
  assert.deepEqual([...iterateBatch(input)], expected);
  assert.deepEqual(replayBatch(input), expected);
  for (const blank of ["", "\n", "\r\n", " \t\r\n\n"]) {
    assert.deepEqual([...iterateBatch(blank)], []);
    assert.deepEqual(replayBatch(blank), []);
  }
  assert.deepEqual(
    [...iterateBatch(good + "\n")],
    [{ ...expected[0], line: 1 }],
  );
});

test("batch iterator rejects oversized UTF-8 input before exposing an iterator", () => {
  const atLimit = " ".repeat(MAX_BATCH_BYTES - 2) + "é";
  assert.equal(Buffer.byteLength(atLimit, "utf8"), MAX_BATCH_BYTES);
  assert.deepEqual(
    [...iterateBatch(atLimit)],
    [{ line: 1, ok: false, error: "Invalid JSON." }],
  );
  for (const input of [atLimit + " ", "x".repeat(MAX_BATCH_BYTES + 1)]) {
    assert.throws(() => iterateBatch(input), /Input exceeds 1 MiB/);
    assert.throws(() => replayBatch(input), /Input exceeds 1 MiB/);
  }
});

test("a blocked then failed output stops batch evaluation without building the remaining results", async (t) => {
  const input = (JSON.stringify(DEFAULT_SCENARIO) + "\n").repeat(1000);
  const parse = t.mock.method(JSON, "parse");
  let entered!: () => void;
  const firstWrite = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const failure = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
  let fail!: () => void;
  const output = new Writable({
    highWaterMark: 1,
    write(_chunk, _encoding, callback) {
      fail = () => callback(failure);
      entered();
    },
  });
  const writing = writeLines(
    (function* () {
      for (const row of iterateBatch(input)) yield JSON.stringify(row);
    })(),
    output,
  );
  const rejected = assert.rejects(writing, failure);
  await firstWrite;
  const parsedWhileBlocked = parse.mock.callCount();
  fail();
  await rejected;
  assert.equal(
    parsedWhileBlocked,
    1,
    "Backpressure must stop simulation of later rows",
  );
  assert.equal(
    parse.mock.callCount(),
    1,
    "Output failure must not drain the batch",
  );
  assert.equal(output.destroyed, true);
});
