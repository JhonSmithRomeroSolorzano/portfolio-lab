import { test, expect } from "@playwright/test";

test("career content loads without downloading the optional experiments", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const chunks: string[] = [];
  page.on("request", (request) => {
    if (/\/(SignalLab|RoutePuzzle|MotionStudio)-.*\.js/.test(request.url()))
      chunks.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByLabel("Core technologies")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Résumé", exact: true })
    .press("Enter");
  await expect(page.locator("#resume")).toBeInViewport();
  expect(chunks).toEqual([]);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Labs & play" })
    .press("Enter");
  await expect(
    page.getByRole("spinbutton", { name: "Exact request rate" }),
  ).toBeVisible();
  expect(chunks.some((url) => url.includes("SignalLab-"))).toBeTruthy();
});

for (const [hash, control] of [
  ["connection-game", "Give me a hint"],
  ["motion-studio", "Play motion"],
]) {
  test(`direct ${hash} entry loads its controls and keeps the anchor focus`, async ({
    page,
  }) => {
    await page.goto(`/#${hash}`);
    await expect(
      page.getByRole("button", { name: control, exact: false }),
    ).toBeVisible();
    await expect(page.locator(`#${hash}`)).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
}

for (const failure of ["aborted", "unavailable"] as const) {
  test(`an ${failure} lab download leaves the resume usable with a clear recovery action`, async ({
    page,
  }) => {
    await page.route("**/SignalLab-*.js", (route) =>
      failure === "aborted"
        ? route.abort()
        : route.fulfill({
            status: 503,
            contentType: "text/javascript",
            body: "temporarily unavailable",
            headers: { "cache-control": "no-store" },
          }),
    );
    await page.goto("/?traffic=237#lab");
    await expect(
      page.getByRole("status").filter({ hasText: "Signal Lab couldn’t load" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reload page" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Résumé", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("link", { name: "Download PDF", exact: true }),
    ).toBeVisible();
    await page.unroute("**/SignalLab-*.js");
    await page.getByRole("button", { name: "Reload page" }).click();
    await expect(
      page.getByRole("spinbutton", { name: "Exact request rate" }),
    ).toHaveValue("237");
  });
}

test("a delayed experiment does not pull the visitor back after navigating away", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/MotionStudio-*.js", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/#motion-studio", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("status").filter({ hasText: "Loading Motion studio" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Overview", exact: true })
    .press("Enter");
  await expect(page.locator("#workbench")).toBeFocused();
  release();
  await expect(
    page.getByRole("button", { name: "Play motion", exact: false }),
  ).toBeVisible();
  await expect(page.locator("#workbench")).toBeFocused();
  await expect(page.locator("#workbench")).toBeInViewport();
});
