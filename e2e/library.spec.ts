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
