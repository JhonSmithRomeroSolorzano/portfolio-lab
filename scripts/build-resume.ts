import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resumeDownloads } from "../src/resume-data.ts";
import { resumeGroups, resumePdf, resumeText } from "./resume-document.ts";

const output = new URL("../public/resume/", import.meta.url);
const groups = resumeGroups();
const pdf = await resumePdf(groups);
await mkdir(output, { recursive: true });
await writeFile(new URL(resumeDownloads.pdf, output), pdf.bytes);
await writeFile(new URL(resumeDownloads.text, output), resumeText(groups));
console.log(
  `Resume exports: ${pdf.pages} PDF pages and plain text in ${fileURLToPath(output)}`,
);
