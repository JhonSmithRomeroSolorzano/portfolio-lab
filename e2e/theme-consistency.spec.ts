import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`${theme} introduction fills its width with aligned, independently sized copy`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 768, 900, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const blocks = page.locator(
        "#intro-title, .intro-role, .intro-stack, .intro-summary",
      );
      await expect(blocks).toHaveCount(4);
      const boxes = await blocks.evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return {
            x,
            y,
            width,
            height,
            fontSize: parseFloat(getComputedStyle(node).fontSize),
          };
        }),
      );
      const [name, role, stack, summary] = boxes;
      expect(Math.abs(role.x - name.x)).toBeLessThan(1);
      expect(Math.abs(stack.x - name.x)).toBeLessThan(1);
      const headingGap = role.y - (name.y + name.height);
      expect(headingGap).toBeGreaterThanOrEqual(20);
      expect(headingGap).toBeLessThanOrEqual(32);
      const positionGap = stack.y - (role.y + role.height);
      expect(positionGap).toBeGreaterThanOrEqual(10);
      expect(positionGap).toBeLessThanOrEqual(14);
      expect(
        Math.abs(summary.x + summary.width - (name.x + name.width)),
      ).toBeLessThan(1);
      if (width > 900) {
        expect(Math.abs(role.y - summary.y)).toBeLessThan(1);
        const columnGap = summary.x - (role.x + role.width);
        expect(columnGap).toBeGreaterThanOrEqual(32);
        expect(columnGap).toBeLessThanOrEqual(56);
        expect(summary.width / name.width).toBeGreaterThan(0.45);
      } else {
        expect(Math.abs(summary.x - name.x)).toBeLessThan(1);
        const summaryGap = summary.y - (stack.y + stack.height);
        expect(summaryGap).toBeGreaterThanOrEqual(16);
        expect(summaryGap).toBeLessThanOrEqual(24);
      }
      if (width >= 1440) {
        // The desktop name occupies one line instead of leaving a vacant half-row.
        expect(name.height).toBeLessThanOrEqual(name.fontSize * 1.1);
        expect(name.width).toBeGreaterThan(1000);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });

  test(`${theme} all selected lab buttons share the engine-speed accent`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const [id, selector] of [
      ["jet-engine", ".jet-engine"],
      ["gravity-loom", ".loom-experience"],
      ["signal-sculpture", ".sculpture-experience"],
      ["motion-studio", ".motion-studio"],
      ["cache-rescue", ".cache-game"],
      ["algorithm-garden", ".algorithm-garden"],
    ]) {
      await page.goto(`/#${id}`);
      const lab = page.locator(selector);
      await expect(lab).toBeVisible();
      // The default 35% is intentionally between the named Engine presets.
      if (id === "jet-engine")
        await lab.locator(".engine-presets button").first().click();
      for (const changed of [false, true]) {
        if (changed)
          await lab.locator('button[aria-pressed="false"]').first().click();
        const colors = await lab.evaluate((node) => {
          const probe = document.createElement("span");
          node.append(probe);
          const resolve = (token: string) => {
            probe.style.color = `var(${token})`;
            return getComputedStyle(probe).color;
          };
          const accent = resolve("--accent");
          const ink = resolve("--flow-ink");
          const buttons = Array.from(
            node.querySelectorAll('button[aria-pressed="true"]'),
            (button) => {
              const css = getComputedStyle(button);
              return {
                background: css.backgroundColor,
                ink: css.color,
                border: css.borderTopColor,
              };
            },
          );
          probe.remove();
          return { accent, ink, buttons };
        });
        expect(colors.buttons.length).toBeGreaterThan(0);
        for (const button of colors.buttons) {
          expect(button.background).toBe(colors.accent);
          expect(button.ink).toBe(colors.ink);
          expect(button.border).toBe(colors.accent);
        }
      }
    }
  });

  test(`${theme} header shares content boundaries and uses plain section names`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".identity-rail")).toHaveAttribute(
      "data-menu-ready",
      "true",
    );
    await expect(page.locator("#main-navigation a")).toHaveText([
      "Overview",
      "Experience",
      "Contact",
      "Labs & play",
    ]);
    await expect(
      page.locator(".rail-brand, #main-navigation a > span"),
    ).toHaveCount(0);
    await expect(
      page.locator('.profile-portrait, img[src*="jhon-smith-romero.jpg"]'),
    ).toHaveCount(0);
    await expect(
      page.getByText("FULL-STACK ENGINEERING", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Open to opportunities", { exact: true }),
    ).toHaveCount(0);
    for (const width of [320, 375, 600, 900, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const header = await page.locator(".identity-rail").boundingBox();
      const content = await page.locator("#workbench").boundingBox();
      expect(Math.abs(header!.x - content!.x)).toBeLessThan(1);
      expect(Math.abs(header!.width - content!.width)).toBeLessThan(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(
      await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .some((entry) => entry.name.includes("jhon-smith-romero.jpg")),
      ),
    ).toBe(false);
  });

  test(`${theme} labs inherit shared surfaces, text and focus colors`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/");
    const labs = [
      ["jet-engine", ".jet-engine"],
      ["gravity-loom", ".loom-experience"],
      ["signal-sculpture", ".sculpture-experience"],
      ["motion-studio", ".motion-studio"],
      ["connection-game", ".route-game"],
      ["cache-rescue", ".cache-game"],
      ["algorithm-garden", ".algorithm-garden"],
    ];
    for (const [id, selector] of labs) {
      await page.goto(`/#${id}`);
      const lab = page.locator(selector);
      await expect(lab).toBeVisible();
      const palette = await lab.evaluate((node) => {
        const css = getComputedStyle(node);
        const root = getComputedStyle(document.documentElement);
        const probe = document.createElement("span");
        node.append(probe);
        const resolve = (token: string) => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        const channels = (color: string) => color.match(/[\d.]+/g)!.map(Number);
        const blend = (front: number[], back: number[], alpha: number) =>
          back
            .slice(0, 3)
            .map((value, i) => front[i] * alpha + value * (1 - alpha));
        const luminance = (color: number[]) =>
          color
            .slice(0, 3)
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i],
              0,
            );
        const rain = blend(
          channels(resolve("--rain-head")),
          channels(resolve("--paper")),
          Number(
            getComputedStyle(document.querySelector(".matrix-backdrop")!)
              .opacity,
          ),
        );
        const surface = channels(css.backgroundColor);
        const backLight = luminance(blend(surface, rain, surface[3] ?? 1));
        const textLight = luminance(channels(resolve("--muted")));
        const result = {
          ink: css.color,
          expectedInk: resolve("--ink"),
          surface: css.backgroundColor,
          surfaces: ["--lab-surface"].map(resolve),
          focus: css.getPropertyValue("--focus").trim(),
          expectedFocus: root.getPropertyValue("--focus").trim(),
          worstMutedContrast:
            (Math.max(backLight, textLight) + 0.05) /
            (Math.min(backLight, textLight) + 0.05),
        };
        // General reading copy must meet the same worst-case rain contrast as labs.
        document.body.append(probe);
        const pageSurface = channels(
          getComputedStyle(document.querySelector(".workbench-intro")!)
            .backgroundColor,
        );
        const pageBackLight = luminance(
          blend(pageSurface, rain, pageSurface[3] ?? 1),
        );
        const pageTextLight = luminance(channels(resolve("--muted")));
        probe.remove();
        return {
          ...result,
          worstPageMutedContrast:
            (Math.max(pageBackLight, pageTextLight) + 0.05) /
            (Math.min(pageBackLight, pageTextLight) + 0.05),
        };
      });
      expect(palette.ink).toBe(palette.expectedInk);
      expect(palette.surfaces).toContain(palette.surface);
      expect(palette.surface).toMatch(/^rgba\(/);
      expect(palette.focus).toBe(palette.expectedFocus);
      expect(palette.worstMutedContrast).toBeGreaterThanOrEqual(4.5);
      expect(palette.worstPageMutedContrast).toBeGreaterThanOrEqual(4.5);
    }
  });
}
