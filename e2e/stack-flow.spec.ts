import { test, expect } from "@playwright/test";
import { STACK_FLOW_STEP_MS } from "../src/features/portfolio/useStackFlow";

test("request packets and node activities follow the complete round trip", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-16T12:01:00Z"));
  await page.goto("/");
  const drawing = page.locator(".stack-drawing");
  await drawing.scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute("data-playing", "true");
  await expect(drawing.getByRole("button")).toHaveCount(4);
  const topology = page.locator(".map-topology");
  const expected = [
    ["frontend", null],
    [null, "frontend:backend"],
    ["backend", null],
    [null, "backend:data"],
    ["data", null],
    [null, "data:backend"],
    ["backend", null],
    [null, "backend:frontend"],
    ["frontend", null],
  ];
  const height = await drawing.evaluate(
    (el) => el.getBoundingClientRect().height,
  );
  for (const [index, [node, route]] of expected.entries()) {
    await expect(topology).toHaveAttribute("data-step", String(index));
    if (index === 2) {
      await expect(page.locator(".stack-node-frontend")).not.toHaveCSS(
        "background-color",
        "rgb(37, 90, 213)",
      );
      await expect(page.locator(".stack-node-infrastructure")).toHaveCSS(
        "border-top-style",
        "dashed",
      );
      const fills = await page
        .locator(".stack-node-frontend, .stack-node-infrastructure")
        .evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).backgroundColor),
        );
      expect(fills[0]).not.toBe(fills[1]);
    }
    if (node) {
      await expect(page.locator(`.stack-node-${node}`)).toHaveCSS(
        "background-color",
        "rgb(37, 90, 213)",
      );
      await expect(page.locator(`.stack-node-${node}`)).toHaveAttribute(
        "data-flow-active",
        "true",
      );
      await expect(page.locator(".map-packet")).toHaveAttribute(
        "data-visible",
        "false",
      );
    } else {
      await expect(page.locator(".map-packet")).toHaveAttribute(
        "data-visible",
        "true",
      );
      const endpoints = await page
        .locator(".map-packet")
        .evaluate((element, route) => {
          const path = element as SVGPathElement;
          const bounds = document
            .querySelector(".map-topology")!
            .getBoundingClientRect();
          const [from, to] = route
            .split(":")
            .map((id) =>
              document
                .querySelector(`.stack-node-${id}`)!
                .getBoundingClientRect(),
            );
          const start = path.getPointAtLength(0);
          const end = path.getPointAtLength(path.getTotalLength());
          return {
            start: [start.x, start.y],
            end: [end.x, end.y],
            expectedStart: [
              route.startsWith("frontend:") || route.startsWith("data:")
                ? from.right - bounds.left
                : from.left - bounds.left,
              from.top + from.height / 2 - bounds.top,
            ],
            expectedEnd: [
              route.endsWith(":backend")
                ? to.left - bounds.left
                : to.right - bounds.left,
              to.top + to.height / 2 - bounds.top,
            ],
          };
        }, route!);
      endpoints.start.forEach((value, i) =>
        expect(value).toBeCloseTo(endpoints.expectedStart[i], 1),
      );
      endpoints.end.forEach((value, i) =>
        expect(value).toBeCloseTo(endpoints.expectedEnd[i], 1),
      );
    }
    expect(
      await drawing.evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(height);
    await page.clock.runFor(STACK_FLOW_STEP_MS);
  }
  await expect(topology).toHaveAttribute("data-step", "0");
  await expect(page.locator(".stack-node-frontend")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("flow automatically resumes after keyboard exploration, offscreen and hidden changes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const drawing = page.locator(".stack-drawing");
  await drawing.scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute("data-playing", "true");
  await page.locator(".stack-node-backend").focus();
  await page.keyboard.press("Enter");
  await expect(drawing).toHaveAttribute("data-playing", "false");
  await expect(page.locator(".stack-node-backend")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const step = await page.locator(".map-topology").getAttribute("data-step");
  await page.clock.runFor(5000);
  await expect(page.locator(".map-topology")).toHaveAttribute(
    "data-step",
    step!,
  );
  await page
    .locator(".stack-node-backend")
    .evaluate((el) => (el as HTMLElement).blur());
  await expect(drawing).toHaveAttribute("data-playing", "true");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute("data-playing", "false");
  await drawing.scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute("data-playing", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(drawing).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(drawing).toHaveAttribute("data-playing", "true");
  await page.evaluate(() => {
    window.location.hash = "resume";
  });
  await expect(drawing).toHaveAttribute("data-playing", "false");
  await drawing.scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute("data-playing", "true");
});

test("reduced motion retains a static explanation and selectable layers", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".stack-drawing").scrollIntoViewIfNeeded();
  await expect(page.locator(".stack-drawing")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(page.locator(".map-packet")).not.toBeVisible();
  await expect(
    page.getByText("Browser → API → data → browser", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  const layout = await page.evaluate(() => {
    const rect = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    return {
      captionBottom: rect(".map-caption").bottom,
      nodeTop: rect(".stack-node").top,
      labelBottom: rect(".map-flow-readout").bottom,
      footnoteTop: rect(".map-footnote").top,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(layout.captionBottom).toBeLessThanOrEqual(layout.nodeTop);
  expect(layout.labelBottom).toBeLessThanOrEqual(layout.footnoteTop);
  expect(layout.overflow).toBe(false);
  await page.locator(".stack-node-data").click();
  await expect(page.locator(".stack-node-data")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".stack-drawing")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".stack-drawing")).toHaveAttribute(
    "data-playing",
    "false",
  );
});
