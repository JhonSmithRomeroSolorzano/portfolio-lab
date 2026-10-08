import { test, expect } from "@playwright/test";

test("unavailable downloads open and focus the exact copyable export", async ({
  page,
}) => {
  await page.addInitScript(() => {
    URL.createObjectURL = () => {
      throw new Error("Download unsupported in this host");
    };
  });
  await page.goto("/?traffic=321#lab");
  await page
    .getByText("Import or export an experiment", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Download experiment JSON", exact: true })
    .click();
  const contents = page.getByLabel("experiment JSON contents", { exact: true });
  await expect(contents).toBeFocused();
  const text = await contents.inputValue();
  expect(JSON.parse(text).scenario.requestsPerSecond).toBe(321);
  expect(
    await contents.evaluate(
      (element: HTMLTextAreaElement) =>
        element.selectionEnd - element.selectionStart,
    ),
  ).toBe(text.length);
  await expect(
    page.getByText(
      "Downloads aren’t available here. The export is ready to copy below.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("export fallback remains usable when a browser refuses the download click", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLAnchorElement.prototype.click = () => {
      throw new Error("Downloads blocked");
    };
  });
  await page.goto("/#lab");
  await page.getByText("Compare two setups", { exact: true }).click();
  await page
    .getByRole("button", { name: "Capture baseline", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Download comparison report", exact: true })
    .click();
  await expect(
    page.getByLabel("comparison report contents", { exact: true }),
  ).toBeFocused();
  await expect(page.locator("a[download]")).toHaveCount(0);
});
