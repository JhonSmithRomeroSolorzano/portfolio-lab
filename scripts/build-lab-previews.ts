import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

// Optional authoring tool: capture the real lab stages, never a live card renderer.
const base = new URL(process.argv[2] ?? "http://127.0.0.1:4191/");
if (
  base.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(base.hostname)
)
  throw new Error(
    "Capture only an explicitly started local production preview.",
  );
const scenes = [
  ["jet-engine", ".engine-stage", "#0e1b2d", "dark"],
  ["gravity-loom", ".loom-stage", "#091d2b", "dark"],
  ["signal-sculpture", ".sculpture-stage", "#112137", "dark"],
  ["motion-studio", ".motion-stage", "#241f37", "light"],
  ["connection-game", ".route-board", "#f1e1ca", "light"],
  ["cache-rescue", ".cache-stage", "#0f2037", "light"],
  ["algorithm-garden", ".garden-tree", "#fff1d6", "light"],
] as const;
const output = new URL("../public/lab-previews/", import.meta.url);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  page.setDefaultTimeout(15000);
  const images: { id: string; bytes: Buffer }[] = [];
  for (const [id, selector, background, colorScheme] of scenes) {
    await page.emulateMedia({ colorScheme });
    const url = new URL(base);
    url.hash = id;
    await page.goto(url.href);
    const stage = page.locator(`#${id} ${selector}`);
    await expect(stage).toBeVisible();
    if (id === "jet-engine")
      await expect(stage).toHaveAttribute("aria-label", /Still engine/);
    if (id === "algorithm-garden")
      await stage.getByRole("button", { name: "Node A", exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    // Release deferred anchor alignment before measuring the final stage crop.
    await page.mouse.click(1, 1);
    const png = await stage.screenshot({
      animations: "disabled",
      scale: "css",
    });
    const encoded = await page.evaluate(
      async ({ source, background }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${source}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 300;
        const context = canvas.getContext("2d")!;
        context.fillStyle = background;
        context.fillRect(0, 0, 480, 300);
        const scale = Math.min(464 / image.width, 284 / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(
          image,
          (480 - width) / 2,
          (300 - height) / 2,
          width,
          height,
        );
        return canvas.toDataURL("image/webp", 0.72).split(",")[1];
      },
      { source: png.toString("base64"), background },
    );
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.length > 20 * 1024)
      throw new Error(`${id} preview exceeds 20 KiB.`);
    images.push({ id, bytes });
  }
  if (
    images.reduce((total, image) => total + image.bytes.length, 0) >
    120 * 1024
  )
    throw new Error("Combined lab previews exceed 120 KiB.");
  await mkdir(output, { recursive: true });
  for (const { id, bytes } of images) {
    await writeFile(new URL(`${id}.webp`, output), bytes);
    console.log(`${id}: ${bytes.length} bytes`);
  }
} finally {
  await browser.close();
}
