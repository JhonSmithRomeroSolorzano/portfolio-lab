import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import {
  digest,
  parseRelease,
  privatePreview,
  verifyRelease,
} from "../scripts/release";

const source = "a".repeat(40);
const entryHtml = "<html><body>portfolio</body></html>";
const good = {
  version: 1 as const,
  source,
  files: { "index.html": digest(entryHtml), "assets/app.js": digest("code") },
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
    else if (req.url === "/") res.end(damaged ? "old portfolio" : entryHtml);
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

test("private verification authenticates assets and tolerates only the provider challenge", async (t) => {
  const requests: string[] = [];
  let html = entryHtml;
  const challenge = `<script>(function(){function c(){var b=a.contentDocument;window.__CF$cv$params={r:'fixture'};a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';}})();</script>`;
  t.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      assert.equal(url.origin, privatePreview);
      assert.equal(
        new Headers(init?.headers).get("OAI-Sites-Authorization"),
        "Bearer fixture-token",
      );
      assert.equal(init?.redirect, "error");
      requests.push(url.pathname);
      return new Response(
        url.pathname === "/release.json"
          ? JSON.stringify(good)
          : url.pathname === "/"
            ? html.replace("</body>", `${challenge}</body>`)
            : "code",
      );
    },
  );
  assert.deepEqual(
    await verifyRelease(new URL(`${privatePreview}/`), source, "fixture-token"),
    good,
  );
  assert.deepEqual(requests, ["/release.json", "/", "/assets/app.js"]);
  await assert.rejects(
    verifyRelease(new URL("https://example.com/"), source, "fixture-token"),
    /cannot be sent/,
  );
  assert.equal(requests.length, 3);
  html = entryHtml.replace("portfolio", "outdated portfolio");
  await assert.rejects(
    verifyRelease(new URL(`${privatePreview}/`), source, "fixture-token"),
    /does not match release: index.html/,
  );
  html = entryHtml.replace(
    "</body>",
    "<script>changedApplication()</script></body>",
  );
  await assert.rejects(
    verifyRelease(new URL(`${privatePreview}/`), source, "fixture-token"),
    /does not match release: index.html/,
  );
});
