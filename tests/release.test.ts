import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { digest, parseRelease, verifyRelease } from "../scripts/release";

const source = "a".repeat(40);
const good = {
  version: 1 as const,
  source,
  files: { "index.html": digest("portfolio"), "assets/app.js": digest("code") },
};
test("release manifests reject path traversal, foreign URLs, empty or invalid fingerprints", () => {
  assert.deepEqual(parseRelease(good), good);
  for (const files of [
    {},
    { "../secret": digest("x") },
    { "https://example.com/file": digest("x") },
    { "index.html": "bad" },
  ])
    assert.throws(() => parseRelease({ ...good, files }));
  assert.throws(() => parseRelease({ ...good, source: "bad" }));
});
test("deployment verification catches stale releases and mixed assets", async () => {
  let stale = false,
    damaged = false;
  const server = createServer((req, res) => {
    if (req.url === "/release.json")
      res.end(
        JSON.stringify({ ...good, source: stale ? "b".repeat(40) : source }),
      );
    else if (req.url === "/index.html")
      res.end(damaged ? "old portfolio" : "portfolio");
    else res.end("code");
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = new URL(`http://127.0.0.1:${address.port}/`);
    assert.deepEqual(await verifyRelease(url, source), good);
    stale = true;
    await assert.rejects(verifyRelease(url, source), /different source commit/);
    stale = false;
    damaged = true;
    await assert.rejects(verifyRelease(url, source), /does not match/);
    await assert.rejects(
      verifyRelease(url, source, "private token"),
      /cannot be sent/,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
