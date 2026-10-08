import { test, expect } from "@playwright/test";

test("rapid controls settle into one complete main result announcement", async ({
  page,
}) => {
  await page.goto("/#lab");
  const announcement = page.getByRole("status", {
    name: "Simulation result",
    exact: true,
  });
  await expect(announcement).toHaveText(
    "Within capacity. At 120 requests per second: mean response 34 milliseconds, 100 percent successful, database demand 24 per second.",
  );
  await page.getByLabel("Exact request rate", { exact: true }).fill("300");
  await page.getByLabel("Exact request rate", { exact: true }).fill("500");
  await page.getByRole("switch", { name: "Read cache", exact: true }).click();
  await expect(announcement).toHaveText(
    "Capacity exceeded. At 500 requests per second: mean response 828 milliseconds, 20 percent successful, database demand 500 per second.",
  );
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  await expect(
    page.locator('.metrics[aria-live], .display-heading [role="status"]'),
  ).toHaveCount(0);
  await expect(page.locator('output[for="traffic"]')).toHaveAttribute(
    "aria-live",
    "off",
  );
});
