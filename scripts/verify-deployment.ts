import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { parseRelease, privatePreview, verifyRelease } from "./release";

const args = process.argv.slice(2);
let privateAuth = false;
let manifestPath = "dist/release.json";
let manifestProvided = false;
const targets: string[] = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--private-stdin") privateAuth = true;
  else if (arg === "--manifest") {
    const value = args[++i];
    if (manifestProvided || !value || value.startsWith("--"))
      throw new Error("Provide one local manifest path after --manifest.");
    manifestPath = value;
    manifestProvided = true;
  } else if (arg.startsWith("--")) {
    throw new Error(`Unknown verification option: ${arg}`);
  } else targets.push(arg);
}
const urls = targets.map(
  (value) => new URL(value.endsWith("/") ? value : `${value}/`),
);
if (!urls.length)
  throw new Error("Provide one or more deployed portfolio URLs.");
const source =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const expected = parseRelease(JSON.parse(await readFile(manifestPath, "utf8")));
if (expected.source !== source)
  throw new Error("Trusted build manifest is from a different source commit.");
let token: string | undefined;
if (privateAuth) {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 32768) throw new Error("Credential input too large.");
  }
  token = JSON.parse(input).token;
  if (typeof token !== "string" || !token.length)
    throw new Error("Missing private preview credential.");
}
for (const url of urls) {
  const release = await verifyRelease(
    url,
    expected,
    url.origin === privatePreview ? token : undefined,
  );
  console.log(
    `Verified ${url.origin}${url.pathname}: ${source.slice(0, 7)}, ${Object.keys(release.files).length} matching assets.`,
  );
}
