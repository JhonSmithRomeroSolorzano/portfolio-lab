import { test, expect } from "@playwright/test";
test("a comparison link restores both setups and can restore the baseline", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("compare");
  await page
    .getByRole("button", { name: "Capture baseline", exact: true })
    .click();
  await page.getByRole("switch", { name: "Read cache", exact: true }).click();
  const link = await page
    .getByLabel("Comparison link", { exact: true })
    .inputValue();
  await page.goto(link);
  await expect(
    page.getByRole("button", { name: "Restore baseline", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Read cache", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "Restore baseline", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Read cache", exact: true }),
  ).toBeChecked();
  expect(
    JSON.parse(new URL(page.url()).searchParams.get("baseline")!).cacheEnabled,
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Restore baseline", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Read cache", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Clear baseline", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.has("baseline")).toBeFalsy();
  await expect(
    page.getByRole("button", { name: "Restore baseline", exact: true }),
  ).toHaveCount(0);
});
test("mobile data tables can be scrolled with the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#lab");
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("requests");
  const region = page.getByRole("region", {
    name: "Request timing",
    exact: true,
  });
  await region.focus();
  await expect(region).toBeFocused();
  await region.press("ArrowRight");
  await expect
    .poll(() => region.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("cache strategies and request deadlines expose their different outcomes", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page.getByLabel("Choose a lab", { exact: true }).selectOption("cache");
  await page.getByLabel("Cache strategy", { exact: true }).selectOption("swr");
  const row = page
    .getByRole("region", { name: "Cache strategy comparison", exact: true })
    .getByRole("row")
    .filter({ hasText: "Stale-while-revalidate" });
  await expect(row.locator("td")).toHaveText(["3", "1", "4"]);
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("requests");
  await page
    .getByLabel("Enforce a deadline from arrival", { exact: true })
    .check();
  await page.getByLabel(/^Deadline:/).press("Home");
  await expect(
    page
      .getByRole("region", { name: "Request timing", exact: true })
      .getByRole("cell", { name: "timed-out", exact: true }),
  ).toHaveCount(16);
});

test("reset clears scenario URL fields synchronously and survives an immediate reload", async ({
  page,
}) => {
  await page.goto(
    "/?traffic=333&cache=off&database=offline&campaign=review#lab",
  );
  const search = await page
    .getByRole("button", { name: "Reset the experiment", exact: false })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      return window.location.search;
    });
  expect(search).toBe("?campaign=review");
  await page.reload();
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toHaveValue("120");
  await expect(
    page.getByRole("switch", { name: "Read cache", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("button", { name: "Normal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
