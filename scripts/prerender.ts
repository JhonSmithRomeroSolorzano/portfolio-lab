import { readFile, writeFile } from "node:fs/promises";
import { renderPortfolio } from "../src/app/prerender";

const path = new URL("../dist/index.html", import.meta.url);
const template = await readFile(path, "utf8");
const marker = '<div id="root"></div>';
if (!template.includes(marker))
  throw new Error("Missing empty portfolio root.");
await writeFile(
  path,
  template.replace(marker, `<div id="root">${renderPortfolio()}</div>`),
);
console.log("Prerendered career content and optional experience placeholders.");
