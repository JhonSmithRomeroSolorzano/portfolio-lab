import assert from "node:assert/strict";
import { Writable } from "node:stream";
import test from "node:test";
import { writeLines } from "../scripts/write-lines";

test("line output waits for backpressure and the final write before completing", async () => {
  let release!: () => void;
  let entered!: () => void;
  const firstWrite = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let pulled = 0;
  const chunks: string[] = [];
  const output = new Writable({
    highWaterMark: 1,
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      release = () => callback();
      entered();
    },
  });
  const lines = (function* () {
    for (const line of ["first", "second", "last"]) {
      pulled++;
      yield line;
    }
  })();
  let completed = false;
  const writing = writeLines(lines, output).then(() => {
    completed = true;
  });
  await firstWrite;
  assert.equal(
    pulled,
    1,
    "Do not pull more input while the destination is full",
  );
  assert.equal(completed, false);
  // Release each callback only after observing that write. No timing-based sleeps.
  for (let i = 1; i <= 3; i++) {
    const next = new Promise<void>((resolve) => {
      entered = resolve;
    });
    assert.equal(chunks.length, i);
    assert.equal(completed, false);
    release();
    if (i < 3) await next;
  }
  await writing;
  assert.equal(output.writableFinished, true);
  assert.deepEqual(chunks, ["first\n", "second\n", "last\n"]);
});

for (const failAt of [1, 3]) {
  test(`line output rejects an asynchronous failure on write ${failAt}`, async () => {
    let writes = 0;
    const failure = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    const output = new Writable({
      write(_chunk, _encoding, callback) {
        writes++;
        setImmediate(() => callback(writes === failAt ? failure : undefined));
      },
    });
    await assert.rejects(
      writeLines(["first", "second", "last"], output),
      failure,
    );
    assert.equal(output.destroyed, true);
    assert.equal(output.writableFinished, false);
  });
}

test("empty line output finishes without writing a row", async () => {
  const output = new Writable({
    write() {
      assert.fail("No writes expected");
    },
  });
  await writeLines([], output);
  assert.equal(output.writableFinished, true);
});
