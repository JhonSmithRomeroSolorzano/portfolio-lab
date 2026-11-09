import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import {
  digest,
  parseRelease,
  privatePreview,
  verifyRelease,
  type Release,
} from "../scripts/release";

const source = "a".repeat(40);
const entryHtml = "<html><body>portfolio</body></html>";
const mismatchedHtml = entryHtml.replace("portfolio", "unexpected content");
const good = {
  version: 1 as const,
  source,
  files: { "index.html": digest(entryHtml), "assets/app.js": digest("code") },
};
const originAwareChallenge = readFileSync(
  new URL("./fixtures/sites-origin-challenge.txt", import.meta.url),
  "utf8",
).trim();
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
  assert.throws(() => parseRelease({ ...good, source: [source] }));
  assert.throws(() =>
    parseRelease({
      ...good,
      files: { ...good.files, "index.html": [good.files["index.html"]] },
    }),
  );
});
test("deployment verification rejects source and content mismatches", async () => {
  let responseSource = source;
  let responseHtml = entryHtml;
  const server = createServer((req, res) => {
    if (req.url === "/release.json") {
      res.end(JSON.stringify({ ...good, source: responseSource }));
    } else if (req.url === "/") {
      res.end(responseHtml);
    } else {
      res.end("code");
    }
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = new URL(`http://127.0.0.1:${address.port}/`);
    assert.deepEqual(await verifyRelease(url, good), good);
    responseSource = "b".repeat(40);
    await assert.rejects(verifyRelease(url, good), /different source commit/);
    responseSource = source;
    responseHtml = mismatchedHtml;
    await assert.rejects(verifyRelease(url, good), /does not match/);
    await assert.rejects(
      verifyRelease(url, good, "private token"),
      /cannot be sent/,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("private verification authenticates assets and tolerates only the provider challenge", async (t) => {
  const requests: string[] = [];
  let html = entryHtml;
  const challenge = originAwareChallenge;
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
    await verifyRelease(new URL(`${privatePreview}/`), good, "fixture-token"),
    good,
  );
  assert.deepEqual(requests, ["/release.json", "/", "/assets/app.js"]);
  await assert.rejects(
    verifyRelease(new URL("https://example.com/"), good, "fixture-token"),
    /cannot be sent/,
  );
  assert.equal(requests.length, 3);
  html = mismatchedHtml;
  await assert.rejects(
    verifyRelease(new URL(`${privatePreview}/`), good, "fixture-token"),
    /does not match release: index.html/,
  );
  html = entryHtml.replace(
    "</body>",
    "<script>changedApplication()</script></body>",
  );
  await assert.rejects(
    verifyRelease(new URL(`${privatePreview}/`), good, "fixture-token"),
    /does not match release: index.html/,
  );
});

test("private verification recognizes the origin-aware provider loader without ignoring page edits", async (t) => {
  // Captured from Sites; request-specific values are replaced with fixture values.
  const challenge = originAwareChallenge;
  let html = entryHtml;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname;
    return new Response(
      path === "/release.json"
        ? JSON.stringify(good)
        : path === "/"
          ? html
          : "code",
    );
  });
  const verify = () => verifyRelease(new URL(`${privatePreview}/`), good);
  const append = (script: string) =>
    entryHtml.replace("</body>", `${script}</body>`);

  for (const script of [
    challenge,
    challenge
      .replaceAll("0123456789abcdef", "fedcba9876543210")
      .replace("MTIzNDU2Nzg5MA==", "OTg3NjU0MzIxMA=="),
  ]) {
    html = append(script);
    assert.deepEqual(await verify(), good);
  }

  for (const altered of [
    append(challenge).replace("portfolio", "unexpected content"),
    append(challenge).replace(
      challenge,
      `<script>changedApplication()</script>${challenge}`,
    ),
    append(challenge.replace("?ray=0123456789abcdef", "?ray=fedcba9876543210")),
    append(challenge.replace("/cdn-cgi/", "https://example.com/")),
    append(challenge.replace("/jsd/main.js", "/jsd/unknown.js")),
    append(challenge.replace("</script>", "changedApplication();</script>")),
    append(challenge.replace("</script>", "/* extra content */</script>")),
    entryHtml.replace("portfolio", `${challenge}portfolio`),
  ]) {
    html = altered;
    await assert.rejects(verify(), /does not match release: index.html/);
  }

  html = append(challenge);
  await assert.rejects(
    verifyRelease(new URL("https://example.com/"), good),
    /does not match release: index.html/,
  );
});

test("a changed remote build cannot replace the trusted artifact while claiming the same source", async (t) => {
  const trusted = {
    ...good,
    files: { ...good.files, "assets/app.css": digest("styles") },
  };
  const requests: string[] = [];
  let remote: Release = trusted;
  const server = createServer((req, res) => {
    requests.push(req.url!);
    res.end(
      req.url === "/release.json"
        ? JSON.stringify(remote)
        : req.url === "/"
          ? mismatchedHtml
          : "changed code",
    );
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = new URL(`http://127.0.0.1:${address.port}/`);
  for (const files of [
    { ...trusted.files, "index.html": digest(mismatchedHtml) },
    { ...trusted.files, "assets/app.js": digest("changed code") },
    { ...good.files }, // Missing a trusted asset, despite a self-consistent remote manifest.
    { ...trusted.files, "assets/extra.js": digest("extra") },
    {
      ...trusted.files,
      "index.html": digest(mismatchedHtml),
      "assets/app.js": digest("changed code"),
    },
  ]) {
    requests.length = 0;
    remote = { ...trusted, files };
    await assert.rejects(verifyRelease(url, trusted), /trusted build artifact/);
    assert.deepEqual(requests, ["/release.json"]);
  }
});

test("trusted manifests are mandatory and remote object order is irrelevant", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    requests++;
    const path = new URL(String(input)).pathname;
    return new Response(
      path === "/release.json"
        ? JSON.stringify({
            ...good,
            files: Object.fromEntries(Object.entries(good.files).reverse()),
          })
        : path === "/"
          ? entryHtml
          : "code",
    );
  });
  const url = new URL("https://example.com/");
  for (const invalid of [undefined, source, { ...good, source: [source] }])
    await assert.rejects(
      verifyRelease(url, invalid as unknown as Release),
      /Invalid release manifest/,
    );
  assert.equal(requests, 0);
  assert.deepEqual((await verifyRelease(url, good)).files, good.files);
});

test("deployment verification never follows a manifest redirect", async (t) => {
  const requests: string[] = [];
  const server = createServer((req, res) => {
    requests.push(req.url!);
    res.writeHead(302, { location: "/redirected" });
    res.end();
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  await assert.rejects(
    verifyRelease(new URL(`http://127.0.0.1:${address.port}/`), good),
  );
  assert.deepEqual(requests, ["/release.json"]);
});

test("legacy challenge-like scripts and appended application code fail closed", async (t) => {
  const legacy =
    "<script>(function(){function c(){var b=a.contentDocument;window.__CF$cv$params={r:'fixture'};a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';}})();</script>";
  let html = entryHtml;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname;
    return new Response(
      path === "/release.json"
        ? JSON.stringify(good)
        : path === "/"
          ? html
          : "code",
    );
  });
  for (const script of [
    legacy,
    legacy.replace(
      "</script>",
      "globalThis.__unexpectedApplicationCode=true;</script>",
    ),
    legacy.replace("</script>", "/* extra content */</script>"),
    legacy.replace("/jsd/main.js", "/jsd/unknown.js"),
  ]) {
    html = entryHtml.replace("</body>", script + "</body>");
    await assert.rejects(
      verifyRelease(new URL(`${privatePreview}/`), good),
      /does not match release: index.html/,
    );
  }
});
