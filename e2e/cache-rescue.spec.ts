import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseLab, openLabTools } from "./lab-tools";

test("cache rescue compares identical bursts, restores shared controls, and remains compact", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#lab");
  await page.getByRole("button", { name: /^Try Cache Rescue/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "One expired key. A crowd of requests.",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("rescue-every-reads")).toHaveText("0");
  await page.getByRole("button", { name: "Show burst result" }).click();
  await expect(page.getByTestId("rescue-every-reads")).toHaveText("16");
  await expect(page.getByTestId("rescue-shared-reads")).toHaveText("1");
  await expect(page.locator(".rescue-result")).toContainText(
    "15 duplicate database reads avoided",
  );
  await page
    .getByLabel("Time between arrivals", { exact: true })
    .selectOption("0");
  await page.getByRole("slider", { name: "Requests in the burst" }).fill("36");
  await page.getByRole("button", { name: "Show burst result" }).click();
  await expect(page.getByTestId("rescue-every-reads")).toHaveText("36");
  await openLabTools(page);
  await page.getByText("Link to this lab", { exact: true }).click();
  const shared = await page
    .getByLabel("Lab entry link", { exact: true })
    .inputValue();
  await page.goto(shared);
  // The generated link can equal the current URL; force a fresh document.
  await page.reload();
  await expect(
    page.getByRole("slider", { name: "Requests in the burst" }),
  ).toHaveValue("36");
  await expect(
    page.getByLabel("Time between arrivals", { exact: true }),
  ).toHaveValue("0");
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.getByTestId("rescue-every-reads")).toHaveText("36");
  await expect(page.locator(".rescue-result")).toContainText(
    "0 of 36 responses",
  );
  await page
    .getByRole("button", { name: "Next event", exact: true })
    .press("Enter");
  await expect(page.locator(".rescue-result")).toContainText(
    "36 of 36 responses",
  );
  await page.getByRole("button", { name: "Reset burst", exact: true }).click();
  await expect(page.getByTestId("rescue-every-reads")).toHaveText("0");
  expect(
    await page.locator(".lab-viewport").evaluate((el) => el.clientHeight),
  ).toBeLessThanOrEqual(680);
});

test("rescue playback pauses on navigation and live reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?lab=rescue#lab");
  await page
    .getByRole("button", { name: "Expire cache & send burst", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause burst", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.getByTestId("rescue-every-reads").textContent())
    .not.toBe("0");
  await page.getByRole("button", { name: "Pause burst", exact: true }).click();
  const at = await page
    .getByRole("slider", { name: "Inspect the burst" })
    .inputValue();
  await page.waitForTimeout(200);
  await expect(
    page.getByRole("slider", { name: "Inspect the burst" }),
  ).toHaveValue(at);
  await page.getByRole("button", { name: "Resume burst", exact: true }).click();
  await chooseLab(page, "traffic");
  const away = await page.locator("#rescue-time").inputValue();
  await page.waitForTimeout(200);
  await expect(page.locator("#rescue-time")).toHaveValue(away);
  await chooseLab(page, "rescue");
  await expect(
    page.getByRole("button", { name: "Pause burst", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Resume burst", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Show burst result", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".cache-rescue")).not.toHaveClass(/is-playing/);
});

for (const theme of ["light", "dark"] as const)
  test(`rescue works at 320px and passes accessibility checks in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme });
    await page.goto("/?lab=rescue#lab");
    await page
      .getByRole("button", { name: "Show burst result", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(
      await page
        .locator(".cache-rescue")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBeTruthy();
    const result = await new AxeBuilder({ page })
      .include(".cache-rescue")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ).toEqual([]);
  });
