import { expect, test } from "@playwright/test";

test("theme ignores events without a storage area and keeps working when storage access is denied", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const toggle = page.locator(".theme-toggle");
  await expect(toggle).toBeEnabled();
  const root = page.locator("html");
  await page.evaluate(async () => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "portfolio-theme",
        newValue: "dark",
      }),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.evaluate(async () => {
    const storageArea = localStorage;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is blocked", "SecurityError");
      },
    });
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "portfolio-theme",
        newValue: "dark",
        storageArea,
      }),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect(root).toHaveAttribute("data-theme", "light");
  await toggle.focus();
  await toggle.press("Enter");
  await expect(root).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} theme at ${width}px ignores iframe session storage but follows local storage`, async ({
      page,
      context,
    }) => {
      const opposite = theme === "light" ? "dark" : "light";
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: opposite,
        reducedMotion: "reduce",
      });
      await page.addInitScript((saved) => {
        if (window === window.top)
          localStorage.setItem("portfolio-theme", saved);
      }, theme);
      await page.goto("/");
      const root = page.locator("html");
      const toggle = page.locator(".theme-toggle");
      await expect(toggle).toHaveAccessibleName(`Switch to ${opposite} theme`);
      await expect(toggle).toBeEnabled();
      await expect(root).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => {
        const frame = document.createElement("iframe");
        frame.id = "theme-storage-fixture";
        frame.hidden = true;
        frame.src = "about:blank";
        document.body.append(frame);
      });
      for (const action of [
        "set-opposite",
        "remove",
        "set-saved",
        "clear",
      ] as const) {
        const event = await page.evaluate(
          async ({ action, theme, opposite }) => {
            const frame = document.querySelector<HTMLIFrameElement>(
              "#theme-storage-fixture",
            )!;
            const received = new Promise<{
              key: string | null;
              session: boolean;
            }>((resolve) => {
              window.addEventListener(
                "storage",
                (event) => {
                  resolve({
                    key: event.key,
                    session: event.storageArea === sessionStorage,
                  });
                },
                { once: true },
              );
            });
            const storage = frame.contentWindow!.sessionStorage;
            if (action === "clear") storage.clear();
            else if (action === "remove") storage.removeItem("portfolio-theme");
            else
              storage.setItem(
                "portfolio-theme",
                action === "set-saved" ? theme : opposite,
              );
            const event = await received;
            // Let React apply any incorrectly accepted event before asserting no change.
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
            return event;
          },
          { action, theme, opposite },
        );
        expect(event).toEqual({
          key: action === "clear" ? null : "portfolio-theme",
          session: true,
        });
        await expect(root).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(() => localStorage.getItem("portfolio-theme")),
        ).toBe(theme);
      }
      await page
        .locator("#theme-storage-fixture")
        .evaluate((frame) => frame.remove());

      const other = await context.newPage();
      try {
        await other.goto("/");
        await other.evaluate(
          (value) => localStorage.setItem("portfolio-theme", value),
          opposite,
        );
        await expect(root).toHaveAttribute("data-theme", opposite);
        await other.evaluate(() => localStorage.removeItem("portfolio-theme"));
        await page.emulateMedia({ colorScheme: theme });
        await expect(root).toHaveAttribute("data-theme", theme);
        await other.evaluate(
          (value) => localStorage.setItem("portfolio-theme", value),
          opposite,
        );
        await expect(root).toHaveAttribute("data-theme", opposite);
        await other.evaluate(() => localStorage.clear());
        await expect(root).toHaveAttribute("data-theme", theme);
        await toggle.focus();
        await toggle.press("Enter");
        await expect(root).toHaveAttribute("data-theme", opposite);
        await expect(toggle).toBeFocused();
        expect(
          await page.evaluate(() => localStorage.getItem("portfolio-theme")),
        ).toBe(opposite);
      } finally {
        await other.close();
      }
    });
  }
}
