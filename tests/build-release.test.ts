import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { digest, parseRelease, verifyRelease } from "../scripts/release";

const execute = promisify(execFile);
const repository = fileURLToPath(new URL("../", import.meta.url));
const script = fileURLToPath(
  new URL("../scripts/build-release.ts", import.meta.url),
);

test("the built manifest verifies résumé PDF bytes independently of the text download", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-manifest-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const pdfPath = "resume/jhon-smith-romero-resume.pdf";
  const pdf = Buffer.concat([
    Buffer.from("%PDF-1.7\n%"),
    Buffer.from([0xe2, 0xe3, 0xcf, 0xd3]),
    Buffer.from("\nfixture bytes\n%%EOF\n"),
  ]);
  const assets: Record<string, string | Buffer> = {
    "index.html": "<html><body>portfolio</body></html>",
    "assets/app.js": "console.log('portfolio')",
    "resume/jhon-smith-romero-resume.txt": "Verified résumé text",
    [pdfPath]: pdf,
  };
  for (const path of ["assets", "resume"])
    await mkdir(join(directory, "dist", path), { recursive: true });
  for (const [path, bytes] of Object.entries(assets))
    await writeFile(join(directory, "dist", path), bytes);
  // Point Git at the real source checkout while the builder reads fixture dist/.
  const git = (args: string[]) =>
    execute("git", args, { cwd: repository, encoding: "utf8" });
  const gitDirectory = (
    await git(["rev-parse", "--absolute-git-dir"])
  ).stdout.trim();
  const source = (await git(["rev-parse", "HEAD"])).stdout.trim();
  await execute(
    process.execPath,
    ["--import", import.meta.resolve("tsx"), script],
    {
      cwd: directory,
      env: { ...process.env, GIT_DIR: gitDirectory, GIT_WORK_TREE: repository },
      timeout: 10_000,
    },
  );
  const release = parseRelease(
    JSON.parse(await readFile(join(directory, "dist/release.json"), "utf8")),
  );
  assert.equal(release.source, source);
  assert.equal(release.files[pdfPath], digest(pdf));
  assert.deepEqual(
    release.files,
    Object.fromEntries(
      Object.entries(assets).map(([path, bytes]) => [path, digest(bytes)]),
    ),
  );

  let servedPdf: Buffer | undefined = pdf;
  const server = createServer((req, res) => {
    const path = req.url === "/" ? "index.html" : req.url!.slice(1);
    const bytes =
      path === "release.json"
        ? JSON.stringify(release)
        : path === pdfPath
          ? servedPdf
          : assets[path];
    res.statusCode = bytes === undefined ? 404 : 200;
    res.end(bytes);
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
  assert.deepEqual(await verifyRelease(url, release), release);
  servedPdf = Buffer.from(pdf);
  servedPdf[15] ^= 1;
  await assert.rejects(
    verifyRelease(url, release),
    /does not match release: resume\/jhon-smith-romero-resume\.pdf/,
  );
  servedPdf = undefined;
  await assert.rejects(verifyRelease(url, release), /404/);
});
