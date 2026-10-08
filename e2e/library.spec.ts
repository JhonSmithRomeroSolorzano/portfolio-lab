import { chooseLab } from "./lab-tools";
import { test, expect } from "@playwright/test";
test("saved experiments can be renamed, removed, restored, and reloaded", async ({
  page,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "library");
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
  await chooseLab(page, "library");
  await expect(
    page.getByRole("button", { name: "Load Renamed setup", exact: true }),
  ).toBeVisible();
});

test("another tab sees new experiments without a reload", async ({
  page,
  context,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "library");
  const other = await context.newPage();
  await other.goto("/#lab");
  await chooseLab(other, "library");
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

test("saving and rename save, cancel, and Escape retain keyboard focus", async ({
  page,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "library");
  await page.getByLabel("Name this setup", { exact: true }).fill("Focus check");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rename Focus check", exact: true })
    .click();
  await page
    .getByLabel("New name for Focus check", { exact: true })
    .fill("New name");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  const rename = page.getByRole("button", {
    name: "Rename New name",
    exact: true,
  });
  await expect(rename).toBeFocused();
  await rename.press("Enter");
  await page
    .getByRole("button", { name: "Cancel rename", exact: true })
    .click();
  await expect(rename).toBeFocused();
  await rename.press("Enter");
  await page
    .getByLabel("New name for New name", { exact: true })
    .press("Escape");
  await expect(rename).toBeFocused();
});

test("clearing the comparison returns keyboard focus to capture", async ({
  page,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "compare");
  await page
    .getByRole("button", { name: "Capture baseline", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Clear baseline", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Capture baseline", exact: true }),
  ).toBeFocused();
});

test("a cross-tab update recovers focus from a removed rename editor", async ({
  page,
  context,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "library");
  await page
    .getByLabel("Name this setup", { exact: true })
    .fill("Concurrent edit");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  const other = await context.newPage();
  await other.goto("/#lab");
  await chooseLab(other, "library");
  await page
    .getByRole("button", { name: "Rename Concurrent edit", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Remove Concurrent edit", exact: true })
    .click();
  await expect(
    page.getByLabel("Name this setup", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText("Experiment library updated from another tab.", {
      exact: true,
    }),
  ).toBeVisible();
  await other.close();
});

test("storage failure remains visible after updating a saved experiment", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota reached", "QuotaExceededError");
    };
  });
  await page.goto("/#lab");
  await chooseLab(page, "library");
  await page.getByLabel("Name this setup", { exact: true }).fill("Visit only");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByLabel("Name this setup", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText("Browser storage is unavailable.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Exact request rate", { exact: true }).fill("333");
  await page
    .getByRole("button", {
      name: "Update Visit only with current setup",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      "Visit only updated with the current setup. Browser storage is unavailable. Changes will last only for this visit. Export a library backup to keep them.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByLabel("Exact request rate", { exact: true }).fill("120");
  await page
    .getByRole("button", { name: "Load Visit only", exact: true })
    .click();
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toHaveValue("333");
  await page
    .getByText("Back up or import your library", { exact: true })
    .click();
  await page.getByText("View or copy library JSON", { exact: true }).click();
  await expect(
    page.getByLabel("library JSON contents", { exact: true }),
  ).toContainText('"requestsPerSecond": 333');
  await page.reload();
  await chooseLab(page, "library");
  await expect(
    page.getByText("No saved experiments yet.", { exact: true }),
  ).toBeVisible();
});
