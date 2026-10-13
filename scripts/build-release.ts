import { execFileSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { digest, type Release } from "./release";

const files: Record<string, string> = {};
async function collect(directory = "") {
  for (const entry of (
    await readdir(`dist/${directory}`, { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = `${directory}${entry.name}`;
    if (entry.isDirectory()) await collect(`${name}/`);
    // PDFs contain generation metadata; verify their source through the commit and the shared text export.
    else if (/\.(html|js|css|woff2|jpg|svg|txt)$/.test(name))
      files[name] = digest(await readFile(`dist/${name}`));
  }
}
await collect();
const release: Release = {
  version: 1,
  source: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  files,
};
await writeFile("dist/release.json", JSON.stringify(release, null, 2) + "\n");
console.log(`Release manifest: ${Object.keys(files).length} assets.`);
