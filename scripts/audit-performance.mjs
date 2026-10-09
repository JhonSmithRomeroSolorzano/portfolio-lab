import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:4173/");
if (!["http:", "https:"].includes(target.protocol))
  throw new Error("Provide an HTTP(S) portfolio URL.");
await mkdir("artifacts", { recursive: true });
const child = spawn(
  process.execPath,
  [
    fileURLToPath(import.meta.resolve("lighthouse/cli/index.js")),
    target.href,
    "--chrome-flags=--headless=new",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=json",
    "--output=html",
    "--output-path=./artifacts/lighthouse",
    "--quiet",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CHROME_PATH: process.env.CHROME_PATH ?? chromium.executablePath(),
    },
  },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
