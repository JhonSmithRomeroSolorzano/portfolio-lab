import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function waitForSculptureCanvas(canvas: Locator) {
  await expect(canvas).toBeVisible();
  // React's playback attribute can commit before the ResizeObserver's redraw.
  // Wait for actual backing pixels, not a fixed delay or playback state alone.
  await expect
    .poll(() =>
      canvas.evaluate((node: HTMLCanvasElement) => {
        const box = node.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        return {
          drawable: box.width > 1 && box.height > 1,
          sized:
            node.width === Math.round(box.width * ratio) &&
            node.height === Math.round(box.height * ratio),
        };
      }),
    )
    .toEqual({ drawable: true, sized: true });
}

type ResizeGateWindow = typeof window & {
  sculptureResizeGate: { pending(): number; release(): void };
};

async function holdSculptureResize(page: Page) {
  // Delay only the sculpture's real ResizeObserver delivery. Other observers,
  // animation frames and layout keep running; no production hooks are added.
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    let held = true;
    const pending = new Map<ResizeObserver, () => void>();
    window.ResizeObserver = class extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          const sculpture = entries.filter((entry) =>
            entry.target.matches("#signal-sculpture canvas"),
          );
          const other = entries.filter((entry) => !sculpture.includes(entry));
          if (other.length) callback(other, observer);
          if (!sculpture.length) return;
          if (held) pending.set(observer, () => callback(sculpture, observer));
          else callback(sculpture, observer);
        });
      }
      disconnect() {
        pending.delete(this);
        super.disconnect();
      }
    };
    (window as ResizeGateWindow).sculptureResizeGate = {
      pending: () => pending.size,
      release() {
        held = false;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const callback of callbacks) callback();
      },
    };
  });
}

test("pixel readiness waits for the sculpture's delayed initial canvas resize", async ({
  page,
}) => {
  await holdSculptureResize(page);
  await page.goto("/#signal-sculpture");
  const stage = page.locator("#signal-sculpture .sculpture-stage");
  const canvas = stage.locator("canvas");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as ResizeGateWindow).sculptureResizeGate.pending(),
      ),
    )
    .toBeGreaterThan(0);
  expect(
    await canvas.evaluate((node: HTMLCanvasElement) => [
      node.width,
      node.height,
    ]),
  ).toEqual([1, 1]);
  await canvas.evaluate((node) => {
    const measure = node.getBoundingClientRect.bind(node);
    node.getBoundingClientRect = () => {
      node.dataset.readinessChecked = "true";
      return measure();
    };
  });
  let ready = false;
  const readiness = waitForSculptureCanvas(canvas).then(() => {
    ready = true;
  });
  try {
    // Synchronize on a real readiness measurement, not an arbitrary sleep.
    await expect(canvas).toHaveAttribute("data-readiness-checked", "true");
    expect(ready).toBe(false);
  } finally {
    await page.evaluate(() =>
      (window as ResizeGateWindow).sculptureResizeGate.release(),
    );
    await readiness;
  }
  expect(
    await canvas.evaluate(
      (node: HTMLCanvasElement) => node.width > 1 && node.height > 1,
    ),
  ).toBe(true);
});

test("sculpture starts in view, transforms without resetting playback, pulses, pauses and resets", async ({
  page,
}) => {
  // Keep the arena and controls visible together; offscreen interruption is
  // exercised separately rather than racing a control's automatic focus scroll.
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  const stage = exhibit.locator(".sculpture-stage");
  await expect(
    exhibit.getByRole("heading", { name: "Signal Sculpture." }),
  ).toBeVisible();
  await expect(stage).toHaveAttribute("data-playing", "true");
  await waitForSculptureCanvas(exhibit.locator("canvas"));
  const pixels = () =>
    exhibit
      .locator("canvas")
      .evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  const initial = await pixels();
  await expect(exhibit.getByRole("status")).toContainText("Monogram in motion");
  // The monogram itself rotates before any shape change or pulse.
  await expect.poll(pixels).not.toBe(initial);
  await exhibit
    .getByRole("button", { name: "Ribbon", exact: true })
    .press("Enter");
  await expect(stage).toHaveAttribute("data-form", "ribbon");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect.poll(pixels).not.toBe(initial);
  await exhibit.getByRole("button", { name: "Pulse", exact: true }).click();
  await expect(exhibit.getByRole("status")).toContainText("Pulse sent");
  await exhibit.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(stage).toHaveAttribute("data-playing", "false");
  const paused = await pixels();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await pixels()).toBe(paused);
  await exhibit.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(stage).toHaveAttribute("data-form", "monogram");
});

test("hidden document freezes sculpture pixels and returning resumes the clock", async ({
  page,
}) => {
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  const stage = exhibit.locator(".sculpture-stage");
  const pixels = () =>
    exhibit
      .locator("canvas")
      .evaluate((node: HTMLCanvasElement) => node.toDataURL());
  await expect(stage).toHaveAttribute("data-playing", "true");
  await waitForSculptureCanvas(exhibit.locator("canvas"));
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-playing", "false");
  const frozen = await pixels();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await pixels()).toBe(frozen);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-playing", "true");
  await expect.poll(pixels).not.toBe(frozen);
});

test("reduced motion settles the sculpture and retains selectable static forms", async ({
  page,
}) => {
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  const stage = exhibit.locator(".sculpture-stage");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-playing", "false");
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await expect(
    exhibit.getByRole("button", { name: "Pulse", exact: true }),
  ).toBeDisabled();
  await exhibit
    .getByRole("button", { name: "Orbit", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText(
    "Orbit displayed without animation",
  );
  await expect(stage).toHaveAttribute("data-form", "orbit");
});

test("canvas denial retains selectable static sculpture forms", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/#signal-sculpture");
  const exhibit = page.locator("#signal-sculpture");
  await expect(exhibit.locator(".sculpture-stage svg")).toBeVisible();
  await expect(
    exhibit.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await exhibit.getByRole("button", { name: "Ribbon", exact: true }).click();
  await expect(exhibit.getByRole("status")).toContainText(
    "Ribbon shown as a static illustration",
  );
});

test("200 percent default text remains readable on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#signal-sculpture");
  await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
  const exhibit = page.locator("#signal-sculpture");
  await exhibit
    .getByRole("button", { name: "Ribbon", exact: true })
    .press("Enter");
  await expect(exhibit.getByRole("status")).toContainText("Ribbon displayed");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [320, 1440]) {
    test(`sculpture reflows at ${width}px in ${theme} with static accessible controls`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (value) => localStorage.setItem("portfolio-theme", value),
        theme,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/#signal-sculpture");
      const exhibit = page.locator("#signal-sculpture");
      await expect(
        exhibit.getByRole("button", { name: "Orbit", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const name of ["Monogram", "Ribbon", "Orbit"]) {
        await exhibit.getByRole("button", { name, exact: true }).click();
        await expect(
          exhibit.getByRole("button", { name, exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (await new AxeBuilder({ page }).include("#signal-sculpture").analyze())
          .violations,
      ).toEqual([]);
      await exhibit.screenshot({
        path: `artifacts/signal-sculpture-${theme}-${width}.png`,
      });
    });
  }
