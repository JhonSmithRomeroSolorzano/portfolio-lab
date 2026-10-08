import { test, expect } from "@playwright/test";
test("frontend experiments show stale responses and different event policies", async ({
  page,
}) => {
  await page.goto("/?lab=search#lab");
  await expect(
    page.getByText("An old response replaced the latest search.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Response policy", { exact: true })
    .selectOption("latest");
  await expect(
    page.getByText("The final result matches the latest search.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByLabel("Choose a lab", { exact: true }).selectOption("events");
  await page
    .getByLabel("Input pattern", { exact: true })
    .selectOption("steady");
  await page
    .getByLabel("Event policy", { exact: true })
    .selectOption("throttle");
  await expect(
    page.getByText("The final input is dropped by leading-only throttle.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("backend and data experiments have distinct controls and retain choices", async ({
  page,
}) => {
  await page.goto("/?lab=circuit#lab");
  await expect(
    page.getByLabel("Circuit cooldown", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("rate-limit");
  await page.getByLabel("Rate limiter", { exact: true }).selectOption("bucket");
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("eviction");
  await page.getByLabel("Eviction policy", { exact: true }).selectOption("lru");
  await page.getByLabel("Choose a lab", { exact: true }).selectOption("writes");
  await page
    .getByLabel("Conflict policy", { exact: true })
    .selectOption("retry");
  await expect(
    page.getByText("The retry applies Client B’s delta to the latest value.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("eviction");
  await expect(page.getByLabel("Eviction policy", { exact: true })).toHaveValue(
    "lru",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
