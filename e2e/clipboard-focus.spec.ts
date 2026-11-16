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
