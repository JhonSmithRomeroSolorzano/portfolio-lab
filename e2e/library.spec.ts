import { test, expect } from "@playwright/test";
test("saved experiments can be renamed, removed, restored, and reloaded", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page.getByText("Your experiment library", { exact: true }).click();
  await page
    .getByLabel("Name this setup", { exact: true })
    .fill("Review setup");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rename Review setup", exact: true })
    .click();
  await page
    .getByLabel("New name for Review setup", { exact: true })
    .fill("Renamed setup");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Renamed setup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo last removal", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Undo last removal", exact: true })
    .click();
  await page.reload();
  await page.getByText("Your experiment library", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load Renamed setup", exact: true }),
  ).toBeVisible();
});

test("another tab sees new experiments without a reload", async ({
  page,
  context,
}) => {
  await page.goto("/#lab");
  await page.getByText("Your experiment library", { exact: true }).click();
  const other = await context.newPage();
  await other.goto("/#lab");
  await other.getByText("Your experiment library", { exact: true }).click();
  await page
    .getByLabel("Name this setup", { exact: true })
    .fill("Shared browser save");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    other.getByRole("button", {
      name: "Load Shared browser save",
      exact: true,
    }),
  ).toBeVisible();
  await other.close();
});
