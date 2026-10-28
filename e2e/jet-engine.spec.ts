import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { airPoint, enginePower } from "../src/domain/playground/jet-engine";

// Physical probes survive reframing the figure to include the wing.
const projection = JSON.parse(
  readFileSync(
    new URL(
      "../src/features/playground/jet-engine/engine-art.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { origin: number[]; axes: number[][] };
const project = (world: readonly number[]): [number, number] =>
  [0, 1].map(
    (axis) =>
      projection.origin[axis] +
      world.reduce(
        (sum, value, i) => sum + value * projection.axes[i][axis],
        0,
      ),
  ) as [number, number];
const probes = {
  near: project([-149, 15.0488626, 106.58306889]),
  hidden: project([77, -13.91710628, 97.04332233]),
};
const reverseProbes = Array.from({ length: 36 }, (_, route) => route)
  .filter((route) => route % 3 !== 0)
  .flatMap((route) =>
    [0.88, 0.94].map((u) =>
      project(airPoint(route, u, enginePower(100), "reverse")),
    ),
  );
async function reversePixels(page: Page) {
  return page.locator(".engine-canvas").evaluate(
    (canvas: HTMLCanvasElement, probes) => {
      const { width, height } = canvas,
        data = canvas.getContext("2d")!.getImageData(0, 0, width, height).data;
      const cool = (at: number) =>
        data[at + 3] > 35 &&
        data[at + 2] > data[at] + 55 &&
        data[at + 2] > data[at + 1] + 15;
      let front = 0,
        rearBlue = 0,
        rearHot = 0;
      for (const [x, y] of probes.front)
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) {
            const px = Math.floor((x * width) / 1100) + dx,
              py = Math.floor((y * height) / 480) + dy;
            if (
              px >= 0 &&
              px < width &&
              py >= 0 &&
              py < height &&
              cool((py * width + px) * 4)
            )
              front++;
          }
      for (let y = 0; y < height; y++)
        for (let x = Math.ceil((probes.rear * width) / 1100); x < width; x++) {
          const at = (y * width + x) * 4;
          if (cool(at)) rearBlue++;
          if (data[at + 3] > 35 && data[at] > data[at + 2] + 55) rearHot++;
        }
      return { front, rearBlue, rearHot };
    },
    { front: reverseProbes, rear: project([185, 0, 102])[0] },
  );
}
function stageFrame(page: Page) {
  return page.locator(".engine-stage").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x + scrollX,
      y: rect.y + scrollY,
      width: rect.width,
      height: rect.height,
    };
  });
}
async function recordDeployment(page: Page, retarget = false) {
  await page
    .locator(".engine-canvas")
    .evaluate((node: HTMLCanvasElement, retarget) => {
      const samples: number[] = [];
      node.dataset.deploymentTrace = "[]";
      node.dataset.retargeted = "false";
      const observer = new MutationObserver(() => {
        const value = Number(node.dataset.reverser);
        samples.push(value);
        node.dataset.deploymentTrace = JSON.stringify(samples);
        if (
          retarget &&
          node.dataset.retargeted !== "true" &&
          value < 0.7 &&
          value > 0.15
        ) {
          node.dataset.retargeted = "true";
          document
            .querySelector<HTMLButtonElement>(".engine-thrust-control button")!
            .click();
        }
      });
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["data-reverser"],
      });
      node.addEventListener(
        "end-deployment-trace",
        () => observer.disconnect(),
        { once: true },
      );
    }, retarget);
}
async function deploymentTrace(page: Page) {
  return page.locator(".engine-canvas").evaluate((node: HTMLCanvasElement) => {
    node.dispatchEvent(new Event("end-deployment-trace"));
    return JSON.parse(node.dataset.deploymentTrace!) as number[];
  });
}

test("reverse thrust visibly redirects only bypass air and preserves paused speed/rotation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#jet-engine");
  await page.getByRole("button", { name: /^Full power/ }).click();
  await page.locator(".engine-canvas").waitFor({ state: "visible" });
  const before = await reversePixels(page),
    phase = await page.locator(".engine-canvas").getAttribute("data-phase");
  const toggle = page.getByRole("button", {
    name: "Reverse thrust",
    exact: true,
  });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".engine-canvas")).toHaveAttribute(
    "data-reverser",
    "1.000",
  );
  const after = await reversePixels(page);
  expect(after.front).toBeGreaterThan(before.front + 60);
  expect(before.rearBlue).toBeGreaterThan(100);
  expect(after.rearBlue).toBeLessThan(before.rearBlue * 0.1);
  expect(after.rearHot).toBeGreaterThan(50);
  await expect(
    page.getByRole("slider", { name: "Engine speed", exact: true }),
  ).toHaveValue("100");
  await expect(page.locator(".engine-canvas")).toHaveAttribute(
    "data-phase",
    phase!,
  );
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator(".engine-feedback")).toContainText(
    "engine rotation does not reverse",
  );
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".engine-canvas")).toHaveAttribute(
    "data-reverser",
    "0.000",
  );
});

test("live reverser eases through deployment while rotors continue forward; Pause and Reset retain intent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas[data-phase]").waitFor();
  const canvas = page.locator(".engine-canvas"),
    toggle = page.getByRole("button", { name: "Reverse thrust", exact: true });
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const phase = Number(await canvas.getAttribute("data-phase"));
  await recordDeployment(page);
  await toggle.click();
  // Linux software rendering may need more than five seconds to settle every
  // eased frame. Keep the exact endpoint and intermediate-frame assertions.
  await expect(canvas).toHaveAttribute("data-reverser", "1.000", {
    timeout: 10000,
  });
  const opening = await deploymentTrace(page);
  expect(opening.some((d) => d > 0.05 && d < 0.95)).toBeTruthy();
  expect(opening.every((d, i) => i === 0 || d >= opening[i - 1])).toBeTruthy();
  expect(
    (Number(await canvas.getAttribute("data-phase")) - phase + Math.PI * 10) %
      (Math.PI * 10),
  ).toBeGreaterThan(0.1);
  // Observe actual frames, not a remote poll that may arrive after closure.
  // Reopen at an intermediate frame to exercise rapid mid-motion retargeting.
  await recordDeployment(page, true);
  await toggle.click();
  await expect(canvas).toHaveAttribute("data-retargeted", "true");
  await expect(canvas).toHaveAttribute("data-reverser", "1.000", {
    timeout: 10000,
  });
  const retargeting = await deploymentTrace(page);
  expect(Math.min(...retargeting)).toBeGreaterThan(0.1);
  expect(retargeting.some((d) => d < 0.8)).toBeTruthy();
  expect(
    retargeting.every(
      (d, i) => i === 0 || Math.abs(d - retargeting[i - 1]) < 0.25,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Pause engine", exact: true }).click();
  const paused = (await pixels(page)).image;
  await page.waitForTimeout(120);
  expect((await pixels(page)).image).toBe(paused);
  await toggle.click();
  await expect(canvas).toHaveAttribute("data-reverser", "0.000");
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await toggle.click();
  await page
    .locator("#jet-engine")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(canvas).toHaveAttribute("data-reverser", "0.000");
  await expect(
    page.getByRole("slider", { name: "Engine speed", exact: true }),
  ).toHaveValue("35");
});

test("the actual opaque assembly remains centered in forward and reverse configurations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas").waitFor({ state: "visible" });
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  const frame = await stageFrame(page);
  for (const mode of ["forward", "reverse"]) {
    if (mode === "reverse")
      await page
        .getByRole("button", { name: "Reverse thrust", exact: true })
        .click();
    const after = await stageFrame(page);
    expect(after).toEqual(frame);
    const center = await page.locator(".engine-stage").evaluate((stage) => {
      const view = document.createElement("canvas");
      view.width = 1100;
      view.height = 480;
      const ctx = view.getContext("2d")!;
      ctx.drawImage(
        stage.querySelector<HTMLImageElement>("img")!,
        0,
        0,
        1100,
        480,
      );
      ctx.drawImage(
        stage.querySelector<HTMLCanvasElement>("canvas")!,
        0,
        0,
        1100,
        480,
      );
      const data = ctx.getImageData(0, 0, 1100, 480).data;
      let left = 1100,
        right = 0,
        top = 480,
        bottom = 0;
      for (let y = 0; y < 480; y++)
        for (let x = 0; x < 1100; x++)
          if (data[(y * 1100 + x) * 4 + 3] > 120) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
      return { x: (left + right) / 2, y: (top + bottom) / 2 };
    });
    expect(Math.abs(center.x - 550)).toBeLessThan(18);
    expect(Math.abs(center.y - 240)).toBeLessThan(18);
  }
});

test("canvas-free reverse mode updates doors and clipped air, remains off at zero, and handles rapid selection", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-feedback")).toContainText(
    "Canvas animation is unavailable",
    // Cold depth-clipped SVG construction exceeded five seconds in Linux
    // WebKit; wait for the real ready state rather than sleeping or skipping it.
    { timeout: 15000 },
  );
  const svg = page.locator(".engine-fallback"),
    toggle = page.getByRole("button", { name: "Reverse thrust", exact: true }),
    before = await svg.innerHTML();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await svg.innerHTML()).not.toEqual(before);
  const reverse = await svg.innerHTML();
  await toggle.click();
  await toggle.click();
  expect(await svg.innerHTML()).toEqual(reverse);
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  await expect(page.locator(".engine-feedback")).toContainText("Engine off");
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator(".fallback-cool")).toHaveCount(0);
});

test("inactive engine policies stop painting rather than repeatedly repainting identical pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.addInitScript(() => {
    const native = CanvasRenderingContext2D.prototype.putImageData;
    CanvasRenderingContext2D.prototype.putImageData = function (
      this: CanvasRenderingContext2D,
      ...args: [ImageData, number, number, ...number[]]
    ) {
      if (this.canvas.matches(".engine-canvas"))
        this.canvas.dataset.testPaints = String(
          Number(this.canvas.dataset.testPaints || 0) + 1,
        );
      Reflect.apply(native, this, args);
    };
  });
  await page.goto("/#jet-engine");
  const canvas = page.locator(".engine-canvas"),
    state = page.locator(".jet-engine");
  const paints = async () =>
    Number(await canvas.getAttribute("data-test-paints"));
  const active = async () => {
    await expect(state).toHaveAttribute("data-playing", "true");
    const before = await paints();
    await expect.poll(paints).toBeGreaterThan(before);
  };
  const idle = async () => {
    await expect(state).toHaveAttribute("data-playing", "false");
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const before = await paints();
    await page.waitForTimeout(180);
    expect(await paints()).toBe(before);
  };
  await active();
  await page.getByRole("button", { name: "Pause engine", exact: true }).click();
  await idle();
  await page.getByRole("button", { name: "Play engine", exact: true }).click();
  await page.locator(".engine-stage").scrollIntoViewIfNeeded();
  await active();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await idle();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await active();
  await page.locator("#resume").scrollIntoViewIfNeeded();
  await idle();
  await page.locator(".engine-stage").scrollIntoViewIfNeeded();
  await active();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await idle();
});

async function pixels(page: Page) {
  return page.locator(".engine-canvas").evaluate((node: HTMLCanvasElement) => {
    const data = node
      .getContext("2d")!
      .getImageData(0, 0, node.width, node.height).data;
    let blue = 0,
      orange = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 3] > 20) {
        if (data[i + 2] > data[i] + 55 && data[i + 2] > data[i + 1] + 15)
          blue++;
        if (data[i] > data[i + 2] + 55) orange++;
      }
    return { blue, orange, image: node.toDataURL() };
  });
}
test("engine speed visibly changes airflow and fan motion, while pause freezes actual canvas pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas[data-spool]").waitFor();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.getByRole("button", { name: /^Idle 25%/ }).click();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
  const phase = await page.locator(".engine-canvas").getAttribute("data-phase");
  await expect
    .poll(() => page.locator(".engine-canvas").getAttribute("data-phase"))
    .not.toBe(phase);
  await page.waitForTimeout(250);
  const low = await pixels(page);
  const flow = Number(
    await page.locator(".engine-canvas").getAttribute("data-flow"),
  );
  await page.getByRole("button", { name: /^Full power 100%/ }).click();
  await expect
    .poll(async () =>
      Number(await page.locator(".engine-canvas").getAttribute("data-spool")),
    )
    .toBeGreaterThan(97);
  const high = await pixels(page);
  expect(high.blue).toBeGreaterThan(low.blue * 1.2);
  expect(high.orange).toBeGreaterThan(low.orange * 1.2);
  expect(
    Number(await page.locator(".engine-canvas").getAttribute("data-flow")),
  ).toBeGreaterThan(flow * 2);
  expect(high.image).not.toBe(low.image);
  await page.getByRole("button", { name: "Pause engine", exact: true }).click();
  const paused = (await pixels(page)).image;
  await page.waitForTimeout(250);
  expect((await pixels(page)).image).toBe(paused);
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  await expect(page.locator(".engine-canvas")).toHaveAttribute(
    "data-flow",
    "0.000",
  );
  // A few anti-aliased metal-edge pixels can fall in the blue classification.
  expect((await pixels(page)).blue).toBeLessThan(low.blue * 0.05);
});

test("reduced-motion speed changes redraw a still composition instead of running a clock", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#jet-engine");
  await page.locator(".engine-canvas[data-spool]").waitFor();
  await page.getByRole("button", { name: /^Idle 25%/ }).press("Enter");
  const low = await pixels(page);
  await page.getByRole("button", { name: /^Full power 100%/ }).press("Enter");
  const high = await pixels(page);
  expect(high.image).not.toBe(low.image);
  expect(high.blue).toBeGreaterThan(low.blue);
  await page.waitForTimeout(250);
  expect((await pixels(page)).image).toBe(high.image);
  await expect(page.locator(".engine-feedback")).toContainText(
    "Reduced motion is on",
  );
});

test("canvas denial keeps static engine parts and speed-dependent SVG air paths", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-fallback")).toBeVisible();
  const low = await page.locator(".fallback-cool").first().getAttribute("d");
  await page.getByRole("button", { name: /^Full power 100%/ }).press("Enter");
  await expect(page.locator(".fallback-cool").first()).not.toHaveAttribute(
    "d",
    low!,
  );
  await expect(
    page.getByRole("button", { name: "Play engine", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".engine-feedback")).toContainText(
    "Canvas animation is unavailable",
  );
});

test("failed casing artwork offers honest recovery without breaking career content", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/engine-back-light-*.svg", (route) =>
    fail
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.continue(),
  );
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-art-error")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Experience.", exact: true }),
  ).toHaveCount(1);
  fail = false;
  await page
    .locator(".engine-art-error")
    .getByRole("button", { name: "Reload page" })
    .click();
  await expect(page.locator(".engine-art-error")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pause engine", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator(".engine-rear")
        .evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
});

test("the former local lock anchor reaches the engine while retaining query context", async ({
  page,
}) => {
  await page.goto("/?source=example#pin-lock");
  await expect(page).toHaveURL(/\?source=example#jet-engine$/);
  await expect(
    page.getByRole("slider", { name: "Engine speed", exact: true }),
  ).toBeVisible();
});

test("the registered drawing reserves its geometry while casing assets are delayed", async ({
  page,
}) => {
  let release!: () => void,
    requested = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/engine-back-*.svg", async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto("/#jet-engine", { waitUntil: "domcontentloaded" });
  await expect.poll(() => requested).toBeTruthy();
  const stage = page.locator(".engine-stage");
  const before = (await stage.boundingBox())!;
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator(".engine-canvas")).toBeHidden();
  expect(before.height).toBeGreaterThan(100);
  expect(before.height / before.width).toBeCloseTo(480 / 1100, 2);
  release();
  await expect
    .poll(() =>
      page
        .locator(".engine-rear")
        .evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
  expect((await stage.boundingBox())!.height).toBeCloseTo(before.height, 0);
  await expect(page.locator(".engine-canvas")).toBeVisible();
  await expect(page.locator(".jet-engine")).toHaveAttribute(
    "data-playing",
    "true",
  );
});

for (const theme of ["light", "dark"] as const)
  test(`near fan faces remain visible and the shaft/casing hide far blades in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#jet-engine");
    await page.locator(".engine-canvas[data-spool]").waitFor();
    await page
      .locator("#jet-engine")
      .getByRole("button", { name: "Reset", exact: true })
      .click();
    await page
      .getByRole("slider", { name: "Engine speed", exact: true })
      .press("Home");
    await expect(page.locator(".engine-canvas")).toHaveAttribute(
      "data-phase",
      "0.000",
    );
    await expect
      .poll(() =>
        page
          .locator(".engine-rear")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBeTruthy();
    const samples = await page
      .locator(".engine-stage")
      .evaluate((stage, probes) => {
        const canvas = stage.querySelector<HTMLCanvasElement>("canvas")!,
          img = stage.querySelector<HTMLImageElement>("img")!;
        const composite = document.createElement("canvas");
        composite.width = canvas.width;
        composite.height = canvas.height;
        const ctx = composite.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas, 0, 0);
        const sample = (x: number, y: number) => {
          const px = Math.floor((x * canvas.width) / 1100),
            py = Math.floor((y * canvas.height) / 480);
          return {
            paint: [
              ...canvas.getContext("2d")!.getImageData(px, py, 1, 1).data,
            ],
            composite: [...ctx.getImageData(px, py, 1, 1).data],
          };
        };
        return {
          near: sample(...probes.near),
          hidden: sample(...probes.hidden),
        };
      }, probes);
    expect(samples.near.paint[3]).toBeGreaterThan(240);
    expect(samples.near.composite.slice(0, 3)).toEqual(
      samples.near.paint.slice(0, 3),
    );
    expect(samples.hidden.paint[3]).toBe(0);
  });

test("SVG-only fallback preserves the same near/far visibility", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#jet-engine");
  await expect(page.locator(".engine-feedback")).toContainText(
    "Canvas animation is unavailable",
    { timeout: 15000 },
  );
  await page
    .getByRole("slider", { name: "Engine speed", exact: true })
    .press("Home");
  const hits = await page
    .locator(".engine-fallback")
    .evaluate((svg, probes) => {
      const faces = [
        ...svg.querySelectorAll<SVGGeometryElement>(".engine-blade"),
      ];
      return {
        near: faces.some((face) =>
          face.isPointInFill(new DOMPoint(...probes.near)),
        ),
        hidden: faces.some((face) =>
          face.isPointInFill(new DOMPoint(...probes.hidden)),
        ),
      };
    }, probes);
  expect(hits).toEqual({ near: true, hidden: false });
});

test.describe("responsive touch controls", () => {
  test.use({ hasTouch: true });
  for (const theme of ["light", "dark"] as const)
    test(`engine controls and static fallback reflow at 320px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/#jet-engine");
      await page.getByRole("button", { name: /^Full power 100%/ }).tap();
      await expect(
        page.getByRole("slider", { name: "Engine speed", exact: true }),
      ).toHaveValue("100");
      await page
        .getByRole("button", { name: "Reverse thrust", exact: true })
        .tap();
      await expect(
        page.getByRole("button", { name: "Reverse thrust", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      const frame = await stageFrame(page);
      await page
        .getByRole("button", { name: "Reverse thrust", exact: true })
        .tap();
      expect(await stageFrame(page)).toEqual(frame);
      await page
        .getByRole("button", { name: "Reverse thrust", exact: true })
        .tap();
      expect(await stageFrame(page)).toEqual(frame);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const result = await new AxeBuilder({ page })
        .include("#jet-engine")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.failureSummary),
        })),
      ).toEqual([]);
    });
});
