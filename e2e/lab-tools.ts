import type { Page } from "@playwright/test";

export async function openLabTools(page: Page) {
  if (!(await page.getByLabel("Choose a lab", { exact: true }).isVisible()))
    await page
      .getByRole("button", { name: "More experiments", exact: true })
      .click();
}
export async function chooseLab(page: Page, id: string) {
  await openLabTools(page);
  await page.getByLabel("Choose a lab", { exact: true }).selectOption(id);
}
