import { expect, test } from "@playwright/test";

const copies = [
  {
    id: "contact",
    container: ".contact-copy",
    button: "Copy contact details",
    field: "Contact details to copy",
    success: "Email and phone copied.",
  },
  {
    id: "motion-studio",
    container: ".motion-recipe",
    button: "Copy CSS",
    field: "Reusable animation CSS",
    success: "CSS copied. Ready for your project.",
  },
] as const;

for (const copy of copies) {
  for (const outcome of ["resolve", "reject"] as const) {
    for (const width of [375, 1440]) {
      test(`${copy.id} retains keyboard focus during a delayed clipboard ${outcome} at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({
          colorScheme: width === 375 ? "dark" : "light",
          reducedMotion: "reduce",
        });
        await page.addInitScript(() => {
          let calls = 0;
          Object.defineProperty(navigator, "clipboard", {
            value: {
              writeText: () =>
                new Promise<void>((resolve, reject) => {
                  Object.assign(window, {
                    pendingCopy: { resolve, reject, calls: ++calls },
                  });
                }),
            },
          });
        });
        await page.goto(`/?review=clipboard-focus#${copy.id}`);
        if (copy.id === "motion-studio")
          await page
            .getByText("Take this motion with you", { exact: true })
            .press("Enter");
        const container = page.locator(copy.container);
        const button = container.getByRole("button");
        await expect(button).toHaveText(copy.button);
        // press() does not wait for enabled controls. The prerendered Contact
        // button has its final label while hydration still keeps it disabled.
        await expect(button).toBeEnabled();
        await button.press("Enter");
        await expect(button).toHaveText("Copying…");
        await expect(button).toBeDisabled();
        await expect(button).toBeFocused();
        await expect(button).toBeInViewport();

        // Both keyboard activation keys must leave the in-flight request alone.
        await button.press("Enter");
        await button.press("Space");
        expect(
          await page.evaluate(() => Reflect.get(window, "pendingCopy").calls),
        ).toBe(1);
        await page.evaluate((outcome) => {
          Reflect.get(window, "pendingCopy")[outcome]();
        }, outcome);
        await expect(button).toBeEnabled();
        if (outcome === "resolve") {
          await expect(container.getByRole("status")).toHaveText(copy.success);
          await expect(button).toBeFocused();
        } else {
          const field = page.getByRole("textbox", { name: copy.field });
          await expect(container.getByRole("status")).toContainText(
            "Clipboard unavailable",
          );
          await expect(field).toBeFocused();
          await expect(field).toBeInViewport();
          expect(
            await field.evaluate(
              (element: HTMLTextAreaElement) =>
                element.selectionStart === 0 &&
                element.selectionEnd === element.value.length,
            ),
          ).toBe(true);
        }
        await expect(page).toHaveURL(
          new RegExp(`\\?review=clipboard-focus#${copy.id}$`),
        );
      });
    }
  }
}

for (const width of [375, 1440])
  test(`contact copy becomes keyboard-ready after held startup at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      colorScheme: width === 375 ? "dark" : "light",
      reducedMotion: "reduce",
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () => {
            Reflect.set(
              window,
              "copyCalls",
              (Reflect.get(window, "copyCalls") ?? 0) + 1,
            );
            return Promise.resolve();
          },
        },
      });
    });
    let release!: () => void;
    const startup = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route("**/assets/index-*.js", async (route) => {
      requested = true;
      await startup;
      await route.continue();
    });
    try {
      await page.goto("/?review=clipboard-startup#contact", {
        waitUntil: "commit",
      });
      await expect.poll(() => requested).toBe(true);
      const container = page.locator(".contact-copy");
      const button = container.getByRole("button", {
        name: "Copy contact details",
      });
      await expect(button).toBeDisabled();
      await expect(container.getByRole("status")).toContainText(
        "Use the contact links above",
      );
      // Reproduce the pre-hydration keypress from the CI trace. It cannot copy
      // or focus a natively disabled button, despite the correct visible label.
      await button.press("Enter");
      await expect(button).not.toBeFocused();
      expect(
        await page.evaluate(() => Reflect.get(window, "copyCalls") ?? 0),
      ).toBe(0);

      release();
      await page.waitForLoadState("load");
      await expect(button).toBeEnabled();
      await button.press("Enter");
      await expect(container.getByRole("status")).toHaveText(
        "Email and phone copied.",
      );
      await expect(button).toBeFocused();
      await expect(button).toBeInViewport();
      expect(await page.evaluate(() => Reflect.get(window, "copyCalls"))).toBe(
        1,
      );
      await expect(page).toHaveURL("/?review=clipboard-startup#contact");
    } finally {
      release();
    }
  });
