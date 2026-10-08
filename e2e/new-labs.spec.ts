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

test("independent lab links preserve settings through immediate reload and history", async ({
  page,
}) => {
  await page.goto("/?lab=writes#lab");
  await page
    .getByLabel("Conflict policy", { exact: true })
    .selectOption("retry");
  await page.reload();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "retry",
  );
  await page.getByText("Link to this lab", { exact: true }).click();
  const link = await page
    .getByLabel("Lab entry link", { exact: true })
    .inputValue();
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("eviction");
  await page.goBack();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "retry",
  );
  await page.goto(link);
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "retry",
  );
  await page.goto("/?lab=writes&setup=broken#lab");
  await expect(
    page.getByText("The lab setup in this link is invalid", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "overwrite",
  );
});

test("guided investigation loads each remedy without opening more panels", async ({
  page,
}) => {
  await page.goto("/?lab=writes#lab");
  await page.getByText("Follow an investigation", { exact: false }).click();
  await page
    .getByLabel("Investigation", { exact: true })
    .selectOption("conflicts");
  await page
    .getByRole("button", { name: "Start investigation", exact: true })
    .click();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "overwrite",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "reject",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByLabel("Conflict policy", { exact: true })).toHaveValue(
    "retry",
  );
  await page
    .getByRole("button", { name: "Finish investigation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start investigation", exact: true }),
  ).toBeVisible();
});

test("lab discovery filters results, restores focus, and keeps the workspace compact", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page
    .getByRole("button", { name: "Browse experiments", exact: true })
    .click();
  await expect(
    page.getByLabel("Find an experiment", { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("Find an experiment", { exact: true })
    .fill("slow response");
  await page
    .getByRole("button", { name: "Frontend Async search", exact: false })
    .click();
  await expect(page.getByLabel("Choose a lab", { exact: true })).toHaveValue(
    "search",
  );
  await expect(page.getByLabel("Choose a lab", { exact: true })).toBeFocused();
  await page
    .getByRole("button", { name: "Browse experiments", exact: true })
    .click();
  await page
    .getByLabel("Find an experiment", { exact: true })
    .fill("not-a-match");
  await expect(
    page.getByText("No match. Try a broader term or another area.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.getByLabel("Find an experiment", { exact: true }).press("Escape");
  await expect(
    page.getByRole("button", { name: "Browse experiments", exact: true }),
  ).toBeFocused();
});

test("event playback advances on demand, stops on lab change, and honors reduced motion", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?lab=search#lab");
  const visible = page.locator(".experiment-tools > div:not([hidden])");
  await visible
    .getByRole("button", { name: "Play events", exact: true })
    .click();
  await expect(
    visible.getByRole("slider", { name: "Inspect event", exact: false }),
  ).toHaveValue("0");
  await page.clock.runFor(1000);
  await expect(
    visible.getByRole("slider", { name: "Inspect event", exact: false }),
  ).toHaveValue("1");
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("eviction");
  await page.clock.runFor(3000);
  await page.getByLabel("Choose a lab", { exact: true }).selectOption("search");
  await expect(
    visible.getByRole("button", { name: "Play events", exact: true }),
  ).toBeVisible();
  await expect(
    visible.getByRole("slider", { name: "Inspect event", exact: false }),
  ).toHaveValue("1");
  await visible
    .getByRole("button", { name: "Play events", exact: true })
    .click();
  await page.clock.runFor(5000);
  await expect(
    visible.getByRole("slider", { name: "Inspect event", exact: false }),
  ).toHaveValue("5");
  await expect(
    visible.getByRole("button", { name: "Play events", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    visible.getByRole("button", { name: "Play events", exact: true }),
  ).toBeDisabled();
  await visible
    .getByRole("button", { name: "First event", exact: true })
    .click();
  await expect(
    visible.getByRole("slider", { name: "Inspect event", exact: false }),
  ).toHaveValue("0");
});

test("timing charts expose request durations and exact retry window counts", async ({
  page,
}) => {
  await page.goto("/?lab=requests#lab");
  await page.getByLabel("Inspect request", { exact: true }).selectOption("4");
  await expect(
    page.getByText(
      "Request 4: arrived at 0 ms, waited 100 ms, worked for 100 ms. Completed at 200 ms.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByLabel("Choose a lab", { exact: true })
    .selectOption("retries");
  await expect(
    page.getByRole("img", { name: "Attempt distribution.", exact: false }),
  ).toBeVisible();
  await page
    .getByRole("slider", { name: "Inspect 100 ms window:", exact: false })
    .fill("1");
  await expect(page.locator('.retry-distribution [role="status"]')).toHaveText(
    /8 attempts without jitter/,
  );
});
