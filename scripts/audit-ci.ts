import { spawn } from "node:child_process";
import { readFile, copyFile } from "node:fs/promises";
import { preview } from "vite";
import {
  assertPerformanceBudget,
  type PerformanceSample,
} from "./performance-budget";

const server = await preview({
  preview: { host: "127.0.0.1", port: 4175, strictPort: true },
});
try {
  const samples: PerformanceSample[] = [];
  for (let run = 1; run <= 3; run++) {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["scripts/audit-performance.mjs", "http://127.0.0.1:4175/"],
        { stdio: "inherit" },
      );
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Lighthouse exited ${code}.`)),
      );
    });
    const report = JSON.parse(
      await readFile("artifacts/lighthouse.report.json", "utf8"),
    );
    if (report.runtimeError)
      throw new Error("Lighthouse could not measure the page.");
    samples.push({
      lcp: report.audits["largest-contentful-paint"].numericValue,
      cls: report.audits["cumulative-layout-shift"].numericValue,
      tbt: report.audits["total-blocking-time"].numericValue,
    });
    await copyFile(
      "artifacts/lighthouse.report.json",
      `artifacts/lighthouse-run-${run}.json`,
    );
  }
  console.log("Mobile Lighthouse medians:", assertPerformanceBudget(samples));
} finally {
  await new Promise<void>((resolve, reject) =>
    server.httpServer?.close((error) => (error ? reject(error) : resolve())),
  );
}
