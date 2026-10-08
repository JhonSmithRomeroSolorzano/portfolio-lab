import { chooseLab } from "./lab-tools";
import { test, expect } from "@playwright/test";

test("only the selected experiment is visible and the workspace stays bounded", async ({
  page,
}) => {
  await page.goto("/#lab");
  const viewport = page.getByRole("region", {
    name: "Experiment workspace",
    exact: true,
  });
  await chooseLab(page, "cache");
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
  await chooseLab(page, "retries");
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
  await chooseLab(page, "traffic");
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
  await chooseLab(page, "queue");
  await page.reload();
  await expect(picker).toHaveValue("queue");
  await page.goBack();
  await expect(picker).toHaveValue("cache");
  await page.goForward();
  await expect(picker).toHaveValue("queue");
});

test("expanded workspace retains settings, traps focus, and returns with Escape", async ({
  page,
}) => {
  await page.goto("/?traffic=345#lab");
  await page
    .getByRole("button", { name: "Expand workspace", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Expanded Signal Lab",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close expanded workspace", exact: true }),
  ).toBeFocused();
  await chooseLab(page, "cache");
  await page.getByLabel("Cache strategy", { exact: true }).selectOption("swr");
  await page
    .getByRole("button", { name: "Close expanded workspace", exact: true })
    .press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Expand workspace", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Cache strategy", { exact: true })).toHaveValue(
    "swr",
  );
  await chooseLab(page, "traffic");
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toHaveValue("345");
  expect(
    await page.locator("body").evaluate((el) => el.style.overflow),
  ).not.toBe("hidden");
});

test("the portfolio starts with one demo and preserves it when extra tools are hidden", async ({
  page,
}) => {
  await page.goto("/#lab");
  await expect(page.getByLabel("Choose a lab", { exact: true })).toBeHidden();
  await expect(
    page.getByText("Follow an investigation", { exact: false }),
  ).toBeHidden();
  await expect(
    page.getByText("Link to this lab", { exact: true }),
  ).toBeHidden();
  await expect(
    page.getByRole("heading", {
      name: "A small system. Real trade-offs.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("WORK IN PROGRESS", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "See the roadmap", exact: false }),
  ).toHaveCount(0);
  await chooseLab(page, "search");
  await page
    .getByLabel("Response policy", { exact: true })
    .selectOption("latest");
  await page
    .getByRole("button", { name: "Hide extra tools", exact: true })
    .click();
  await expect(page.getByLabel("Choose a lab", { exact: true })).toBeHidden();
  await expect(page.getByLabel("Response policy", { exact: true })).toHaveValue(
    "latest",
  );
  await page.reload();
  await expect(page.getByLabel("Choose a lab", { exact: true })).toBeHidden();
  await expect(page.getByLabel("Response policy", { exact: true })).toHaveValue(
    "latest",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  const toolbar = await page.locator(".lab-topbar").boundingBox();
  const workspace = await page
    .getByRole("region", { name: "Experiment workspace", exact: true })
    .boundingBox();
  expect(workspace!.y).toBeGreaterThanOrEqual(toolbar!.y + toolbar!.height - 1);
  await page
    .getByRole("button", {
      name: "Explore infrastructure experience",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", {
      name: "See my delivery experience",
      exact: false,
    }),
  ).toHaveAttribute("href", "#resume");
});
