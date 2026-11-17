import { createReadStream } from "node:fs";
import { MAX_BATCH_BYTES, iterateBatch } from "./batch.ts";
import { writeLines } from "./write-lines.ts";
const input = process.argv[2];
let operation = "Input";
try {
  if (input === "--help") {
    operation = "Output";
    await writeLines(
      [
        "Usage: npm run replay -- [scenarios.ndjson|-]\nOne scenario per line; stdin is the default. Results are NDJSON. Exit: 0 all valid, 1 invalid scenarios, 2 input/output error (including a closed output pipe).",
      ],
      process.stdout,
    );
  } else if (process.argv.length > 3) {
    console.error("Expected at most one input path. Use --help.");
    process.exitCode = 2;
  } else {
    const stream =
      !input || input === "-" ? process.stdin : createReadStream(input);
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_BATCH_BYTES) throw new Error("Input exceeds 1 MiB.");
      chunks.push(buffer);
    }
    const rows = iterateBatch(Buffer.concat(chunks).toString("utf8"));
    let total = 0,
      failed = 0;
    operation = "Output";
    await writeLines(
      (function* () {
        for (const row of rows) {
          total++;
          if (!row.ok) failed++;
          yield JSON.stringify(row);
        }
      })(),
      process.stdout,
    );
    console.error(
      `${total} scenarios; ${failed} invalid. Results are illustrative, not production measurements.`,
    );
    process.exitCode = failed ? 1 : 0;
  }
} catch (error) {
  console.error(
    `${operation} error: ${error instanceof Error ? error.message : "Unknown error."}`,
  );
  process.exitCode = 2;
}
