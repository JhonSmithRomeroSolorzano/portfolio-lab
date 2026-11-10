import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("contact details copy together without launching an external application", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          Object.assign(window, { copiedContact: text });
        },
      },
    });
  });
  await page.goto("/#contact");
  await page
    .getByRole("button", { name: "Copy contact details" })
    .press("Enter");
  await expect(page.locator(".contact-copy [role=status]")).toHaveText(
    "Email and phone copied.",
  );
  expect(await page.evaluate(() => Reflect.get(window, "copiedContact"))).toBe(
    "jhon.smith@ucp.edu.co\n+57 3202065522",
  );
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole("link", { name: "jhon.smith@ucp.edu.co", exact: true }),
  ).toHaveAttribute("href", "mailto:jhon.smith@ucp.edu.co");
});

for (const clipboard of ["denied", "missing"] as const) {
  test(`${clipboard} clipboard provides selectable contact text and can recover`, async ({
    page,
  }) => {
    await page.addInitScript((clipboard) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value:
          clipboard === "missing"
            ? undefined
            : {
                writeText: async () => {
                  throw new Error("denied");
                },
              },
      });
    }, clipboard);
    await page.goto("/#contact");
    const copy = page.getByRole("button", { name: "Copy contact details" });
    await copy.press("Enter");
    const fallback = page.getByRole("textbox", {
      name: "Contact details to copy",
    });
    await expect(fallback).toBeFocused();
    await expect(fallback).toHaveValue("jhon.smith@ucp.edu.co\n+57 3202065522");
    expect(
      await fallback.evaluate(
        (field: HTMLTextAreaElement) =>
          field.selectionEnd - field.selectionStart,
      ),
    ).toBe(36);
    await expect(page.locator(".contact-copy [role=status]")).toContainText(
      "Clipboard unavailable",
    );
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async () => {} },
      });
    });
    await copy.press("Enter");
    await expect(page.locator(".contact-copy [role=status]")).toHaveText(
      "Email and phone copied.",
    );
    await expect(fallback).toHaveCount(0);
  });
}

test("a slow clipboard denial does not steal focus after the visitor moves on", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise<void>((_, reject) => {
            Object.assign(window, { denyContact: reject });
          }),
      },
    });
  });
  await page.goto("/#contact");
  await page
    .getByRole("button", { name: "Copy contact details" })
    .press("Enter");
  await expect(page.getByRole("button", { name: "Copying…" })).toBeDisabled();
  const linkedin = page.getByRole("link", { name: "Find me on LinkedIn" });
  await linkedin.focus();
  await page.evaluate(() => Reflect.get(window, "denyContact")());
  await expect(
    page.getByRole("textbox", { name: "Contact details to copy" }),
  ).toBeVisible();
  await expect(linkedin).toBeFocused();
});

for (const theme of ["light", "dark"] as const) {
  test(`contact copy fits a narrow ${theme} layout and has accessible controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/#contact");
    const copy = page.getByRole("button", { name: "Copy contact details" });
    await expect(copy).toBeEnabled();
    await copy.focus();
    await expect(copy).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("#contact").analyze()).violations,
    ).toEqual([]);
  });
}

test("native contact links remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/#contact");
  await expect(
    page.getByRole("link", { name: "jhon.smith@ucp.edu.co", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy contact details" }),
  ).toBeDisabled();
  await context.close();
});
