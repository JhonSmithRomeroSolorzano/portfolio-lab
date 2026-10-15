import { test, expect } from "@playwright/test";
import { LINKEDIN } from "../src/features/portfolio/data/profile";
import {
  loomViewport,
  projectLoomPoint,
} from "../src/features/playground/gravity-loom/viewport";

test("releasing a point removed by a keyboard command gives safe feedback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1600 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const field = exhibit.getByRole("group", {
    name: "Interactive gravity field",
  });
  await expect(field).toBeVisible();
  const box = await field.boundingBox();
  if (!box) throw new Error("Missing gravity field");
  const point = projectLoomPoint(
    { x: 0.36, y: 0 },
    loomViewport(box.width - 2, box.height - 2),
  );
  await page.mouse.move(box.x + 1 + point.x, box.y + 1 + point.y);
  await page.mouse.down();
  await expect(field).toHaveAttribute("data-dragging", "true");
  await exhibit
    .getByRole("button", { name: "Remove last", exact: true })
    .press("Enter");
  await page.mouse.up();
  await expect(field).toHaveAttribute("data-dragging", "false");
  await expect(exhibit.getByRole("status")).toContainText("removed");
  expect(errors).toEqual([]);
});

test.describe("narrow touch review", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("a finger can select a point off-center without shifting it", async ({
    page,
  }) => {
    await page.goto("/#gravity-loom");
    const exhibit = page.locator("#gravity-loom");
    const field = exhibit.getByRole("group", {
      name: "Interactive gravity field",
    });
    await expect(field).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const box = await field.boundingBox();
    if (!box) throw new Error("Missing gravity field");
    const point = projectLoomPoint(
      { x: -0.36, y: 0 },
      loomViewport(box.width - 2, box.height - 2),
    );
    await page.touchscreen.tap(box.x + 1 + point.x + 12, box.y + 1 + point.y);
    await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
      "horizontal -36%",
    );
    await expect(field).toHaveAttribute("data-dragging", "false");
    await expect(field).toHaveAttribute("data-playing", "true");
  });

  test("Chromium native touch dragging holds the page while a swipe outside the field scrolls", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Native touch-move injection uses Chromium CDP; WebKit touch taps are covered separately.",
    );
    await page.goto("/#gravity-loom");
    const field = page.getByRole("group", {
      name: "Interactive gravity field",
    });
    await expect(field).toBeVisible();
    const box = await field.boundingBox();
    if (!box) throw new Error("Missing gravity field");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const before = await page.evaluate(() => scrollY);
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 8; step++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + step * 4, y: y - step * 4 }],
      });
    await expect(field).toHaveAttribute("data-dragging", "true");
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(field).toHaveAttribute("data-dragging", "false");
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 8, y: 600 }],
    });
    for (let step = 1; step <= 8; step++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 8, y: 600 - step * 35 }],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(before);
    await session.detach();
  });
});

test("grabbing the edge of a point keeps its position and secondary cancellation does not end the drag", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const field = exhibit.getByRole("group", {
    name: "Interactive gravity field",
  });
  await expect(field).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const box = await field.boundingBox();
  if (!box) throw new Error("Missing gravity field");
  const viewport = loomViewport(box.width - 2, box.height - 2);
  const point = projectLoomPoint({ x: -0.36, y: 0 }, viewport);
  const x = box.x + 1 + point.x + 15;
  const y = box.y + 1 + point.y;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(field).toHaveAttribute("data-dragging", "true");
  await field.dispatchEvent("pointercancel", {
    pointerId: 99,
    isPrimary: false,
  });
  await expect(field).toHaveAttribute("data-dragging", "true");
  await page.mouse.up();
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal -36%",
  );
  await page.mouse.down();
  await page.mouse.move(x + viewport.scaleX * 0.1, y, { steps: 8 });
  await page.mouse.up();
  await expect(exhibit.locator(".loom-fine-controls p")).toContainText(
    "horizontal -26%",
  );
});

test("holding Space toggles once, while repeated arrows give updated position feedback", async ({
  page,
}) => {
  await page.goto("/#gravity-loom");
  const exhibit = page.locator("#gravity-loom");
  const field = exhibit.getByRole("group", {
    name: "Interactive gravity field",
  });
  await field.focus();
  await page.keyboard.down("Space");
  await expect(field).toHaveAttribute("data-playing", "true");
  await page.keyboard.down("Space");
  await expect(field).toHaveAttribute("data-playing", "true");
  await page.keyboard.up("Space");
  await field.press("Space");
  await expect(field).toHaveAttribute("data-playing", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await field.press("ArrowRight");
  await expect(exhibit.getByRole("status")).toContainText("horizontal -28%");
  await field.press("ArrowRight");
  await expect(exhibit.getByRole("status")).toContainText("horizontal -20%");
  await expect(exhibit.getByRole("status")).toHaveAttribute(
    "aria-atomic",
    "true",
  );
  await expect(field).toHaveAttribute("data-playing", "false");
});

for (const theme of ["light", "dark"] as const) {
  test(`mobile recruiter can read experience, download both formats and reach contact in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript(
      (value) => localStorage.setItem("portfolio-theme", value),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?review=recruiter");
    const menu = page.getByRole("navigation", { name: "Main navigation" });
    await menu
      .getByRole("link", { name: "Résumé", exact: true })
      .press("Enter");
    await expect(page.locator("#resume")).toBeFocused();
    await expect(
      page.getByRole("group", { name: "Resume resources" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(
      await page
        .locator(".experience-summary")
        .first()
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    for (const [name, extension] of [
      ["Download PDF", "pdf"],
      ["Plain text", "txt"],
    ] as const) {
      const link = page.getByRole("link", { name, exact: true });
      expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      const pending = page.waitForEvent("download");
      await link.press("Enter");
      const download = await pending;
      expect(download.suggestedFilename()).toBe(
        `jhon-smith-romero-resume.${extension}`,
      );
      expect(await download.failure()).toBeNull();
      const response = await page.request.get(
        (await link.getAttribute("href")) ?? "",
      );
      expect(response.ok()).toBe(true);
      if (extension === "pdf") {
        expect(response.headers()["content-type"]).toContain("application/pdf");
        expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
      } else {
        expect(response.headers()["content-type"]).toContain("text/plain");
        expect(await response.text()).toContain("Nimrod | https://nimrod.io/");
      }
    }
    await menu
      .getByRole("link", { name: "Contact", exact: true })
      .press("Enter");
    await expect(page.locator("#contact")).toBeFocused();
    const contact = page.locator("#contact");
    expect(
      await contact
        .locator("p")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    const linkedin = contact.getByRole("link", { name: "Find me on LinkedIn" });
    await expect(linkedin).toHaveAttribute("href", LINKEDIN);
    expect((await linkedin.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await linkedin.focus();
    await expect(linkedin).toBeFocused();
    await contact.screenshot({
      path: `artifacts/oct15-contact-${theme}-320.png`,
    });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(linkedin).toBeVisible();
    await expect(page).toHaveURL(/review=recruiter#contact$/);
  });
}
