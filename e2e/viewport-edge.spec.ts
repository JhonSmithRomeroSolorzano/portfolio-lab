import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";

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
          new URL("./fixtures/viewport-edge-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "viewport-edge-probe",
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

async function openProbe(page: Page, kind: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/__viewport-edge?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<style>
      body { margin: 0; height: 2400px; }
      #drawing { position: absolute; top: 800px; left: 0; width: 200px; height: 200px; }
      button { position: fixed; top: 0; right: 0; }
    </style><div id="probe"></div>`,
    }),
  );
  await page.goto(`/__viewport-edge?kind=${kind}`);
  await page.addScriptTag({ type: "module", content: fixture });
  const drawing = page.locator("#drawing");
  await expect(drawing).toHaveAttribute("data-playing", "false");
  // Observe with the native browser too: establish the initial edge notification
  // before scrolling, without replacing the hook's observer or its entries.
  await drawing.evaluate(
    (target) =>
      new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(target);
      }),
  );
  return drawing;
}

for (const kind of ["autoplay", "stack"] as const) {
  test(`${kind} begins after a native zero-area entry becomes visible`, async ({
    page,
  }) => {
    const drawing = await openProbe(page, kind);
    await page.evaluate(() => scrollTo(0, 1));
    await expect
      .poll(() => drawing.evaluate((node) => node.getBoundingClientRect().top))
      .toBe(799);
    await expect(drawing).toHaveAttribute("data-playing", "true");
  });
}

for (const kind of ["autoplay", "stack", "explicit"] as const) {
  test(`${kind} stops at the viewport edge after a one-pixel intersection`, async ({
    page,
  }) => {
    const drawing = await openProbe(page, kind);
    await page.evaluate(() => scrollTo(0, 900));
    if (kind === "explicit")
      await page.getByRole("button", { name: "Play" }).click();
    await expect(drawing).toHaveAttribute("data-playing", "true");
    await page.evaluate(() => scrollTo(0, 999));
    await expect
      .poll(() =>
        drawing.evaluate((node) => node.getBoundingClientRect().bottom),
      )
      .toBe(1);
    await expect(drawing).toHaveAttribute("data-playing", "true");
    await page.evaluate(() => scrollTo(0, 1000));
    await expect
      .poll(() =>
        drawing.evaluate((node) => node.getBoundingClientRect().bottom),
      )
      .toBe(0);
    await expect(drawing).toHaveAttribute("data-playing", "false");
    await page.evaluate(() => scrollTo(0, 900));
    await expect(drawing).toHaveAttribute(
      "data-playing",
      kind === "explicit" ? "false" : "true",
    );
    if (kind === "explicit") {
      await page.getByRole("button", { name: "Play" }).click();
      await expect(drawing).toHaveAttribute("data-playing", "true");
    }
  });
}
