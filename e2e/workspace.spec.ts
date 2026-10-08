import { test, expect } from "@playwright/test";

test("only the selected experiment is visible and the workspace stays bounded", async ({
  page,
}) => {
  await page.goto("/#lab");
  const picker = page.getByLabel("Choose a lab", { exact: true });
  const viewport = page.getByRole("region", {
    name: "Experiment workspace",
    exact: true,
  });
  await picker.selectOption("cache");
  await expect(
    page.getByRole("heading", {
      name: "Explore cache expiry and stale reads",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "A small system. Real trade-offs.",
      exact: true,
    }),
  ).toBeHidden();
  await picker.selectOption("retries");
  await expect(
    page.getByRole("heading", {
      name: "Explore cache expiry and stale reads",
      exact: true,
    }),
  ).toBeHidden();
  expect(
    await viewport.evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(680);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await picker.selectOption("traffic");
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toBeVisible();
});

test("selected labs survive reload and browser history restores the previous lab", async ({
  page,
}) => {
  await page.goto("/?lab=cache#lab");
  const picker = page.getByLabel("Choose a lab", { exact: true });
  await expect(picker).toHaveValue("cache");
  await picker.selectOption("queue");
  await page.reload();
  await expect(picker).toHaveValue("queue");
  await page.goBack();
  await expect(picker).toHaveValue("cache");
  await page.goForward();
  await expect(picker).toHaveValue("queue");
});
