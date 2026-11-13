import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function dockPosition(page: Page) {
  return page.evaluate(() => {
    const content = document.getElementById("gravity-loom")!;
    const top = content.getBoundingClientRect().top;
    const focus = document.activeElement;
    return {
      scroll: scrollY,
      contentTop: top,
      contentDocumentTop: scrollY + top,
      documentHeight: document.documentElement.scrollHeight,
      fonts: document.fonts.status,
      fontSize: getComputedStyle(document.documentElement).fontSize,
      focus: focus && {
        tag: focus.tagName,
        id: focus.id,
        text: focus.textContent?.trim().slice(0, 120),
      },
      menuOpen: document
        .querySelector(".identity-rail")
        ?.getAttribute("data-menu-open"),
    };
  });
}

async function expectDockPosition(
  page: Page,
  before: Awaited<ReturnType<typeof dockPosition>>,
  info: Pick<TestInfo, "attach">,
  action: string,
) {
  const after = await dockPosition(page);
  try {
    expect(after.scroll).toBeCloseTo(before.scroll, 0);
    expect(after.contentTop).toBeCloseTo(before.contentTop, 0);
  } catch (error) {
    // Attach only on failure, after the action and strict assertions. In
    // particular, do not instrument native focus or wait away a scroll jump.
    await info.attach(`dock-position-${action}`, {
      body: JSON.stringify(
        {
          before,
          after,
          delta: {
            scroll: after.scroll - before.scroll,
            contentTop: after.contentTop - before.contentTop,
            contentDocumentTop:
              after.contentDocumentTop - before.contentDocumentTop,
            documentHeight: after.documentHeight - before.documentHeight,
          },
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    throw error;
  }
}

test("dock diagnostics reject scroll-only and content-only movement with the original tolerance", async ({
  page,
}) => {
  await page.setContent(`
    <style>html { scroll-behavior: auto } body { height: 3000px; margin: 0 }
    #gravity-loom { margin-top: 500px }</style>
    <header class="identity-rail" data-menu-open="false"></header>
    <section id="gravity-loom">Reading position</section>
  `);
  await page.evaluate(() => scrollTo(0, 100));
  const attachments = new Map<string, string>();
  const info: Pick<TestInfo, "attach"> = {
    async attach(name, options) {
      attachments.set(name, String(options?.body));
    },
  };
  const beforeScroll = await dockPosition(page);
  await page.evaluate(() => scrollBy(0, 51));
  await expect(
    expectDockPosition(page, beforeScroll, info, "scroll"),
  ).rejects.toThrow();
  expect(JSON.parse(attachments.get("dock-position-scroll")!).delta).toEqual({
    scroll: 51,
    contentTop: -51,
    contentDocumentTop: 0,
    documentHeight: 0,
  });
  const beforeContent = await dockPosition(page);
  await page.evaluate(() => {
    document.getElementById("gravity-loom")!.style.transform =
      "translateY(51px)";
  });
  await expect(
    expectDockPosition(page, beforeContent, info, "content"),
  ).rejects.toThrow();
  expect(JSON.parse(attachments.get("dock-position-content")!).delta).toEqual({
    scroll: 0,
    contentTop: 51,
    contentDocumentTop: 51,
    documentHeight: 0,
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`keyboard dock controls use immediate scrolling before section navigation in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    await page.goto("/#gravity-loom");
    await expect(page.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "true",
    );
    // Establish keyboard modality, then exercise every control in the sticky row.
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "Menu", exact: true });
    for (const control of [
      toggle,
      page.getByRole("button", { name: /Switch to .* theme/ }),
      page.locator(".motion-settings summary"),
    ]) {
      await control.focus();
      expect(
        await control.evaluate((node) => node.matches(":focus-visible")),
      ).toBe(true);
      await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
    }
    await toggle.press("Enter");
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Experience", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#resume$/);
    await expect(page.locator("#resume")).toBeFocused();
    await expect(page.locator(".loom-stage")).not.toBeInViewport();
    await expect(page.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "false",
    );
  });

  for (const [width, height, textSize] of [
    [390, 844, 100],
    [320, 568, 200],
    [844, 390, 100],
    [844, 390, 200],
  ]) {
    test(`mobile dock remains reachable deep in the page in ${theme} at ${width}×${height}, ${textSize}% text`, async ({
      page,
      browserName,
    }, info) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/?review=wayfinding#gravity-loom");
      await expect(
        page.getByRole("button", { name: "Add attractor" }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      // Finish direct-entry ownership before checking a reader's navigation.
      await page.keyboard.press("Escape");
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}%`;
        document.querySelector("#gravity-loom")!.scrollIntoView();
      }, textSize);
      const header = page.locator(".identity-rail");
      const toggle = page.getByRole("button", { name: "Menu", exact: true });
      const tapMenu = async () => {
        const box = (await toggle.boundingBox())!;
        // Locator.click auto-scrolls before input; use an actual viewport tap
        // to verify the sticky control is reachable without scrolling first.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      };
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      await expect(header).toHaveCSS("position", "sticky");
      await expect(toggle).toBeInViewport({ ratio: 1 });
      const position = await dockPosition(page);
      expect(position.scroll).toBeGreaterThan(height * 2);
      await tapMenu();
      await expect(nav.getByRole("link").first()).toBeFocused();
      await expectDockPosition(page, position, info, "open");
      const menu = (await nav.boundingBox())!;
      expect(menu.y).toBeGreaterThanOrEqual(0);
      expect(menu.y + menu.height).toBeLessThanOrEqual(height - 8);
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expectDockPosition(page, position, info, "escape");
      await page.keyboard.press("Enter");
      await expect(nav.getByRole("link").first()).toBeFocused();
      // macOS WebKit uses Option+Tab to include links in keyboard traversal.
      const tab =
        browserName === "webkit" && process.platform === "darwin"
          ? "Alt+Tab"
          : "Tab";
      for (const link of await nav.getByRole("link").all()) {
        await expect(link).toBeFocused();
        // Viewport intersection alone cannot detect an opaque overlay covering focus.
        expect(
          await link.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const hit = document.elementFromPoint(
              box.left + box.width / 2,
              box.top + box.height / 2,
            );
            return hit === node || node.contains(hit);
          }),
        ).toBe(true);
        await page.keyboard.press(tab);
      }
      await expect(nav).not.toBeVisible();
      const afterTraversal = await dockPosition(page);
      await tapMenu();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expectDockPosition(page, afterTraversal, info, "reopen-escape");
      await toggle.press("Enter");
      await nav
        .getByRole("link", { name: "Contact", exact: true })
        .press("Enter");
      await expect(page).toHaveURL(/review=wayfinding#contact$/);
      await expect(page.locator("#contact")).toBeFocused();
      await expect(nav).not.toBeVisible();
      const dock = (await header.boundingBox())!;
      await expect
        .poll(() =>
          page
            .locator("#contact")
            .evaluate((node) => node.getBoundingClientRect().top),
        )
        .toBeGreaterThan(dock.y + dock.height);
      await page.keyboard.press(tab);
      const focused = page.locator(":focus");
      await expect(focused).toBeInViewport({ ratio: 1 });
      expect((await focused.boundingBox())!.y).toBeGreaterThan(
        dock.y + dock.height,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}
