import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import type { CanvasStartupWindow } from "./fixtures/canvas-startup-probe";
import {
  installLifecycleProbe,
  readLifecycleSnapshot,
} from "./helpers/lifecycle-probe";

let fixture: string;
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL("./fixtures/canvas-startup-probe.tsx", import.meta.url),
        ),
        formats: ["es"],
        fileName: "canvas-startup-probe",
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw new Error("Missing fixture bundle");
  const entry = output.output.find(
    (item) => item.type === "chunk" && item.isEntry,
  );
  if (!entry || entry.type !== "chunk")
    throw new Error("Missing fixture entry");
  fixture = entry.code;
});

for (const resize of [true, false])
  test(`failed canvas startup cleans up before retry, ResizeObserver=${resize}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: resize ? 1440 : 390, height: 900 });
    await page.addInitScript(installLifecycleProbe);
    if (!resize)
      await page.addInitScript(() => {
        Object.defineProperty(window, "ResizeObserver", { value: undefined });
      });
    await page.route("**/__canvas-startup", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<style>.sculpture-stage{width:320px;height:240px}canvas{width:100%;height:100%;--accent:green;--lab-trace:teal}</style><article tabindex="-1"><div id="probe-root"></div></article>`,
      }),
    );
    await page.goto("/__canvas-startup");
    await page.addScriptTag({ type: "module", content: fixture });
    await expect
      .poll(() =>
        page.evaluate(() => !!(window as CanvasStartupWindow).canvasStartup),
      )
      .toBe(true);
    const baseline = await page.evaluate(readLifecycleSnapshot);
    await page.evaluate(() =>
      (window as CanvasStartupWindow).canvasStartup.mount(),
    );
    const retry = page.getByRole("button", {
      name: "Try Signal Sculpture again",
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await retry.click();
      await expect(page.getByRole("alert")).toContainText("ran into a problem");
      await expect(retry).toBeVisible();
      await expect
        .poll(() => page.evaluate(readLifecycleSnapshot))
        .toEqual(baseline);
    }
    // The same error boundary can recover; cleanup must not swallow the error
    // or leave old callbacks drawing into detached canvases after a theme change.
    await page.evaluate(() =>
      (window as CanvasStartupWindow).canvasStartup.recover(),
    );
    await retry.click();
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Reduced motion is enabled",
    );
    await page.getByRole("button", { name: "Ribbon", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Ribbon", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
      window.dispatchEvent(new Event("resize"));
    });
    await page.screenshot({
      path: testInfo.outputPath("recovered-canvas.png"),
    });
    await page.evaluate(() =>
      (window as CanvasStartupWindow).canvasStartup.unmount(),
    );
    await expect
      .poll(() => page.evaluate(readLifecycleSnapshot))
      .toEqual(baseline);
  });
