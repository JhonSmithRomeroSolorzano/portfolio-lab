import { readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { assertAssetBudget, type AssetSizes } from "./performance-budget";

const sizes: AssetSizes = {
  entryJsGzip: 0,
  allJsGzip: 0,
  cssGzip: 0,
  htmlGzip: gzipSync(await readFile("dist/index.html")).length,
  fonts: 0,
  portrait: (await readFile("dist/jhon-smith-romero.jpg")).length,
};
for (const file of await readdir("dist/assets")) {
  const source = await readFile(`dist/assets/${file}`);
  if (/^JetEngine-.*\.js$/.test(file) && source.includes("legacyLayer"))
    throw new Error("Audit-only mesh metadata leaked into the engine bundle.");
  const bytes = gzipSync(source).length;
  if (file.endsWith(".js")) sizes.allJsGzip += bytes;
  if (/^index-.*\.js$/.test(file)) sizes.entryJsGzip += bytes;
  if (file.endsWith(".css")) sizes.cssGzip += bytes;
}
for (const file of await readdir("dist/fonts"))
  if (file.endsWith(".woff2"))
    sizes.fonts += (await readFile(`dist/fonts/${file}`)).length;
if (!sizes.entryJsGzip || !sizes.cssGzip)
  throw new Error("Missing production entry assets.");
assertAssetBudget(sizes);
console.log("Asset budgets passed:", sizes);
