import { chooseLab } from "./lab-tools";
import { test, expect } from "@playwright/test";
const local = "http://127.0.0.1:4174/#lab";
async function openClient(page: import("@playwright/test").Page) {
  await page.goto(local);
  await chooseLab(page, "api");
}
test("local API is explicitly selected and real responses remain distinct from round-trip time", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/local-api/")) requests++;
  });
  await openClient(page);
  await expect(
    page.getByText(
      "Select the local API, then send the current setup when you’re ready.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests).toBe(0);
  await page
    .getByRole("radio", { name: "Browser + local API check", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Send current setup", exact: true })
    .click();
  await expect(
    page.getByText("The API and browser agree.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("34.4 ms", { exact: true })).toBeVisible();
  await expect(
    page.getByText("HTTP round trip", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
  await page.getByLabel("Exact request rate", { exact: true }).fill("300");
  await expect(
    page.getByText("Previous setup — send again to verify your changes.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(requests).toBe(1);
});
test("cancelled and outdated API responses cannot overwrite newer controls", async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/local-api/v1/simulate", async (route) => {
    await held;
    await route.abort().catch(() => {});
  });
  await openClient(page);
  await page
    .getByRole("radio", { name: "Browser + local API check", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Send current setup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel API request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send current setup", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Send current setup", exact: true })
    .click();
  await page.getByLabel("Exact request rate", { exact: true }).fill("201");
  await expect(
    page.getByText("Setup changed. Send the new setup when ready.", {
      exact: true,
    }),
  ).toBeVisible();
  release();
  await expect(
    page.getByLabel("Exact request rate", { exact: true }),
  ).toHaveValue("201");
  await expect(
    page.getByText("The API and browser agree.", { exact: true }),
  ).toHaveCount(0);
});
test("API errors leave browser results usable and allow retry", async ({
  page,
}) => {
  await page.route("**/local-api/v1/simulate", (route) =>
    route.fulfill({
      status: 429,
      headers: { "retry-after": "7", "x-request-id": "limited-1" },
      body: "{}",
    }),
  );
  await openClient(page);
  await page
    .getByRole("radio", { name: "Browser + local API check", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Send current setup", exact: true })
    .click();
  await expect(
    page.getByText(
      "The API request budget is exhausted. Try again in 7 seconds. Request ID: limited-1.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.unroute("**/local-api/v1/simulate");
  await page
    .getByRole("button", { name: "Send current setup", exact: true })
    .click();
  await expect(
    page.getByText("The API and browser agree.", { exact: true }),
  ).toBeVisible();
});
test("production build offers setup instructions without a local network control", async ({
  page,
}) => {
  await page.goto("/#lab");
  await chooseLab(page, "api");
  await expect(
    page.getByText("This hosted demo uses browser calculations.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "Browser + local API check", exact: true }),
  ).toHaveCount(0);
});
