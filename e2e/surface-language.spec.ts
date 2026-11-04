import { expect, test } from "@playwright/test";

const labs = [
  ["jet-engine", ".jet-engine"],
  ["gravity-loom", ".loom-experience"],
  ["signal-sculpture", ".sculpture-experience"],
  ["motion-studio", ".motion-studio"],
  ["connection-game", ".route-game"],
  ["cache-rescue", ".cache-game"],
  ["algorithm-garden", ".algorithm-garden"],
] as const;

for (const theme of ["light", "dark"] as const) {
  for (const width of [320, 1440]) {
    test(`${theme} at ${width}px uses angular panels and consistent control surfaces`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/");
      await expect(page.locator(".identity-rail")).toHaveAttribute(
        "data-menu-ready",
        "true",
      );
      // All reading surfaces have the same opacity; no per-paragraph highlighter.
      const panels = page.locator(
        ".workbench-intro, .technology-overview, #resume, #contact, .collection-card",
      );
      const surfaces = await panels.evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).backgroundColor),
      );
      expect(surfaces.length).toBeGreaterThan(4);
      expect(new Set(surfaces).size).toBe(1);
      expect(surfaces[0]).toMatch(/^rgba\(/);
      for (const node of [".intro-copy", ".workbench-intro p"]) {
        for (const background of await page
          .locator(node)
          .evaluateAll((nodes) =>
            nodes.map((node) => getComputedStyle(node).backgroundColor),
          ))
          expect(background).toBe("rgba(0, 0, 0, 0)");
      }
      await expect(page.locator(".identity-rail")).toHaveCSS(
        "box-shadow",
        "none",
      );
      for (const [id, selector] of labs) {
        await page.goto(`/#${id}`);
        const lab = page.locator(selector);
        await expect(lab).toBeVisible();
        await expect(page.locator(`#${id}`)).toHaveCSS("outline-style", "none");
        await page.mouse.move(0, 0);
        await expect(lab).toHaveCSS("background-color", surfaces[0]);
        const result = await page.evaluate(() => {
          const probe = document.createElement("span");
          document.body.append(probe);
          const resolve = (token: string) => {
            probe.style.color = `var(${token})`;
            return getComputedStyle(probe).color;
          };
          const control = resolve("--surface-control");
          const border = resolve("--control-border");
          const shapeSelectors = [
            ".identity-rail",
            ".theme-toggle",
            ".mobile-menu-toggle",
            ".motion-settings summary",
            ".motion-settings-panel",
            ".workbench-intro",
            ".stack-map",
            ".stack-node",
            ".current-role",
            "#contact",
            ".primary-button",
            ".collection-card",
            ".collection-preview",
            ".jet-engine",
            ".loom-experience",
            ".sculpture-experience",
            ".motion-studio",
            ".route-game",
            ".cache-game",
            ".algorithm-garden",
            ".loom-stage",
            ".sculpture-stage",
            ".garden-workspace",
            ".cache-console",
            ".route-board",
            ".experiment-placeholder",
            ".play-exhibit button:not(.garden-node)",
            ".play-exhibit select",
            ".play-exhibit textarea",
            '.play-exhibit input[type="number"]',
          ].join(",");
          const rounded = Array.from(
            document.querySelectorAll(shapeSelectors),
          ).flatMap((node) => {
            const css = getComputedStyle(node);
            const corners = [
              css.borderTopLeftRadius,
              css.borderTopRightRadius,
              css.borderBottomLeftRadius,
              css.borderBottomRightRadius,
            ];
            return corners.some((value) => value !== "0px")
              ? [{ tag: node.tagName, name: node.className, corners }]
              : [];
          });
          const secondarySelectors = [
            ".theme-toggle",
            ".mobile-menu-toggle:not([aria-expanded=true])",
            ".motion-settings:not([open]) summary",
            ".resume-download",
            ".play-actions button",
            ".cache-reset",
            ".cache-rounds button",
            ".cache-strategies button",
            ".garden-modes button",
            ".garden-shapes button",
            ".motion-options button",
            ".route-hint button",
            ".loom-experience button",
            ".sculpture-controls button",
            ".engine-toolbar button:not(.engine-play)",
            ".engine-thrust-control button",
            ".play-field select",
            ".loom-placement select",
            ".motion-recipe textarea",
            ".cache-prediction input",
          ].join(",");
          const inconsistent = Array.from(
            document.querySelectorAll(secondarySelectors),
          )
            .filter((node) => node.getAttribute("aria-pressed") !== "true")
            .flatMap((node) => {
              const css = getComputedStyle(node);
              return css.backgroundColor !== control ||
                css.borderTopColor !== border ||
                css.boxShadow !== "none"
                ? [
                    {
                      name: node.className || node.tagName,
                      background: css.backgroundColor,
                      border: css.borderTopColor,
                      shadow: css.boxShadow,
                    },
                  ]
                : [];
            });
          probe.remove();
          return { rounded, inconsistent };
        });
        expect(result.rounded, id).toEqual([]);
        expect(result.inconsistent, id).toEqual([]);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }

  test(`${theme} shares hover, primary and keyboard-focus treatments`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const [id, selector] of [
      ["jet-engine", ".engine-thrust-control button"],
      ["gravity-loom", '.loom-actions button[aria-pressed="false"]'],
      ["signal-sculpture", '.sculpture-forms button[aria-pressed="false"]'],
      ["motion-studio", '.motion-options button[aria-pressed="false"]'],
      ["connection-game", ".route-game .play-actions button:not(:disabled)"],
      ["cache-rescue", '.cache-rounds button[aria-pressed="false"]'],
      ["algorithm-garden", '.garden-shapes button[aria-pressed="false"]'],
    ]) {
      await page.goto(`/#${id}`);
      const button = page.locator(selector).first();
      await expect(button).toBeVisible();
      const colors = await button.evaluate((node) => {
        const probe = document.createElement("span");
        node.append(probe);
        const resolve = (token: string) => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        const colors = {
          hover: resolve("--control-hover"),
          accent: resolve("--accent"),
          ink: resolve("--flow-ink"),
          focus: resolve("--focus"),
        };
        probe.remove();
        return colors;
      });
      await button.hover();
      await expect(button).toHaveCSS("background-color", colors.hover);
      await expect(button).toHaveCSS("border-top-color", colors.accent);
      await page.mouse.move(0, 0);
      // A keyboard-origin focus must remain a real, green focus ring.
      await button.focus();
      await button.press("Tab");
      const focused = page.locator(":focus");
      await expect(focused).toHaveCSS("outline-color", colors.focus);
      await expect(focused).toHaveCSS("outline-width", "3px");
      for (const primary of await page.locator(".primary-button").all()) {
        await expect(primary).toHaveCSS("background-color", colors.accent);
        await expect(primary).toHaveCSS("color", colors.ink);
      }
    }
  });
}
