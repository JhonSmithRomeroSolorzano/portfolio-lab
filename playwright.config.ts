import { defineConfig } from "@playwright/test";

const requestedPort = process.env.PLAYWRIGHT_PORT ?? "4173";
const port = Number(requestedPort);
if (
  !requestedPort ||
  /\D/.test(requestedPort) ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
)
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1 and 65535.");
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["list"],
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "artifacts/playwright-results.json" }],
      ]
    : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: [
    {
      command: `npm run preview -- --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: false,
    },
  ],
});
