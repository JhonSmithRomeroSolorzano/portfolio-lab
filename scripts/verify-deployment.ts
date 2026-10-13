import { execFileSync } from "node:child_process";
import { privatePreview, verifyRelease } from "./release";

const args = process.argv.slice(2);
const privateAuth = args.includes("--private-stdin");
const urls = args
  .filter((arg) => arg !== "--private-stdin")
  .map((value) => new URL(value.endsWith("/") ? value : `${value}/`));
if (!urls.length)
  throw new Error("Provide one or more deployed portfolio URLs.");
const source =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
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
let reference: string | undefined;
for (const url of urls) {
  const release = await verifyRelease(
    url,
    source,
    url.origin === privatePreview ? token : undefined,
  );
  const fingerprint = JSON.stringify(Object.entries(release.files).sort());
  if (reference && fingerprint !== reference)
    throw new Error("Deployments have different build assets.");
  reference = fingerprint;
  console.log(
    `Verified ${url.origin}${url.pathname}: ${source.slice(0, 7)}, ${Object.keys(release.files).length} matching assets.`,
  );
}
