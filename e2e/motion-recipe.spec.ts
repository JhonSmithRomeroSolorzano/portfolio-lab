import { test, expect } from "@playwright/test";

test("motion recipe follows the selected curve and copies a reduced-motion-safe example", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          Object.assign(window, { copiedCss: text });
        },
      },
    }),
  );
  await page.goto("/#motion-studio");
  await page.getByText("Take this motion with you", { exact: true }).click();
  await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
    /1100ms cubic-bezier\(\.16,1,\.3,1\)/,
  );
  await page.getByRole("button", { name: "Copy CSS", exact: true }).click();
  await expect(page.locator(".motion-recipe [role=status]")).toContainText(
    "CSS copied",
  );
  const css = await page.evaluate(() => Reflect.get(window, "copiedCss"));
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain("animation: none");
  await page.getByRole("button", { name: "Steady", exact: true }).click();
  await expect(page.getByLabel("Reusable animation CSS")).toBeVisible();
  await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
    /1100ms linear/,
  );
  await expect(page.locator(".motion-recipe [role=status]")).toBeEmpty();
  await page.getByRole("slider", { name: /Duration/ }).press("ArrowRight");
  await expect(page.getByLabel("Reusable animation CSS")).toBeVisible();
  await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
    /1200ms linear/,
  );
  await page.getByRole("button", { name: "Copy CSS", exact: true }).click();
  expect(await page.evaluate(() => Reflect.get(window, "copiedCss"))).toContain(
    "1200ms linear",
  );
});

for (const outcome of ["resolve", "reject"] as const) {
  test(`a delayed clipboard ${outcome} cannot change feedback or focus for a new recipe`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise<void>((resolve, reject) => {
              Object.assign(window, { finishCopy: { resolve, reject } });
            }),
        },
      });
    });
    await page.goto("/#motion-studio");
    await page.getByText("Take this motion with you", { exact: true }).click();
    await page.getByRole("button", { name: "Copy CSS", exact: true }).click();
    await expect(page.getByRole("button", { name: "Copying…" })).toBeDisabled();
    const steady = page.getByRole("button", { name: "Steady", exact: true });
    await steady.press("Enter");
    await page.evaluate((outcome) => {
      Reflect.get(window, "finishCopy")[outcome]();
    }, outcome);
    await expect(steady).toBeFocused();
    await expect(page.getByLabel("Reusable animation CSS")).toBeVisible();
    await expect(page.getByLabel("Reusable animation CSS")).toHaveValue(
      /1100ms linear/,
    );
    await expect(page.locator(".motion-recipe [role=status]")).toBeEmpty();
    await expect(
      page.getByRole("button", { name: "Copy CSS", exact: true }),
    ).toBeEnabled();
  });
}
test("blocked clipboard gives a selectable CSS fallback", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await page.goto("/#motion-studio");
  await page
    .getByText("Take this motion with you", { exact: true })
    .press("Enter");
  await page
    .getByRole("button", { name: "Copy CSS", exact: true })
    .press("Enter");
  await expect(page.getByLabel("Reusable animation CSS")).toBeFocused();
  expect(
    await page.getByLabel("Reusable animation CSS").evaluate((field) => {
      const text = field as HTMLTextAreaElement;
      return (
        text.selectionStart === 0 && text.selectionEnd === text.value.length
      );
    }),
  ).toBe(true);
  await expect(page.locator(".motion-recipe [role=status]")).toContainText(
    "copy it manually",
  );
});

for (const width of [375, 1440]) {
  test(`a delayed clipboard denial preserves navigation away at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise<void>((_, reject) => {
              Object.assign(window, { denyRecipeCopy: reject });
            }),
        },
      });
    });
    await page.goto("/?review=recipe-focus#motion-studio");
    await page
      .getByText("Take this motion with you", { exact: true })
      .press("Enter");
    await page
      .getByRole("button", { name: "Copy CSS", exact: true })
      .press("Enter");
    await expect(page.getByRole("button", { name: "Copying…" })).toBeDisabled();
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    if (await menu.isVisible()) await menu.press("Enter");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .press("Enter");
    const contact = page.locator("#contact");
    await expect(contact).toBeFocused();
    await expect(contact).toBeInViewport();
    const scroll = await page.evaluate(() => scrollY);
    await page.evaluate(() => Reflect.get(window, "denyRecipeCopy")());
    await expect(page.locator(".motion-recipe [role=status]")).toContainText(
      "copy it manually",
    );
    await expect(contact).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
    await expect(page).toHaveURL(/\?review=recipe-focus#contact$/);
  });
}
