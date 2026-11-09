import type { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

/** Own and end this output stream; await writes and propagate asynchronous errors. */
export async function writeLines(lines: Iterable<string>, output: Writable) {
  await pipeline(
    (function* () {
      for (const line of lines) yield line + "\n";
    })(),
    output,
  );
}
