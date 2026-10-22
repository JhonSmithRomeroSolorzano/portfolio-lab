import { test, expect } from "@playwright/test";

test("career content loads without downloading the optional experiments", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const chunks: string[] = [];
  page.on("request", (request) => {
    if (
      /\/(CacheRescue|RoutePuzzle|MotionStudio|AlgorithmGarden|SignalSculpture|GravityLoom|JetEngine)-.*\.js/.test(
        request.url(),
      )
    )
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
    page.getByRole("slider", { name: "Engine speed" }),
  ).toBeVisible();
  expect(chunks.some((url) => url.includes("JetEngine-"))).toBeTruthy();
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
    await page.route("**/CacheRescue-*.js", (route) =>
      failure === "aborted"
        ? route.abort()
        : route.fulfill({
            status: 503,
            contentType: "text/javascript",
            body: "temporarily unavailable",
            headers: { "cache-control": "no-store" },
          }),
    );
    await page.goto("/?traffic=237#cache-rescue");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Cache Rescue couldn’t load" }),
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
    await page.unroute("**/CacheRescue-*.js");
    await page.getByRole("button", { name: "Reload page" }).click();
    await expect(
      page.getByRole("button", { name: "Send the crowd", exact: false }),
    ).toBeVisible();
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

for (const phase of ["render", "effect"] as const) {
  test(`a game ${phase} exception stays inside its boundary and can be retried`, async ({
    page,
  }) => {
    await page.route("**/CacheRescue-*.js", async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      // Use the built module's own React runtime for an authentic effect failure.
      const reactImport = source.match(
        /import\{([^}]+)\}from\s*["']([^"']+)["']/,
      );
      const effectAlias = reactImport?.[1].match(/(?:^|,)r as (\w+)/)?.[1];
      expect(reactImport).toBeTruthy();
      const fault =
        phase === "render"
          ? 'if (!window.__experienceRecovered) throw new Error("render failure");'
          : `${effectAlias}.useEffect(() => { if (!window.__experienceRecovered) throw new Error("effect failure"); }, []);`;
      await route.fulfill({
        response,
        contentType: "text/javascript",
        body: source.replace(
          /export\{[^}]+\};?\s*$/,
          `export function CacheRescue() { ${fault} return "Recovered experience"; }`,
        ),
      });
    });
    await page.goto("/#cache-rescue");
    await expect(page.getByRole("alert")).toContainText(
      "Cache Rescue ran into a problem",
    );
    await expect(page.locator("#rescue-title")).toHaveText("Cache Rescue");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Résumé", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("link", { name: "Download PDF", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      Object.assign(window, { __experienceRecovered: true });
    });
    await page.getByRole("button", { name: "Try Cache Rescue again" }).click();
    await expect(page.locator("#cache-rescue")).toContainText(
      "Recovered experience",
    );
    await page
      .getByRole("navigation", { name: "Explore the collection" })
      .getByRole("link", { name: /Algorithm Garden/ })
      .click();
    await expect(
      page
        .locator("#algorithm-garden")
        .getByRole("button", { name: "Hint the next node" }),
    ).toBeVisible();
  });
}

test("unsupported intersection observation keeps the portfolio and games usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", { value: undefined });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#resume");
  await expect(
    page.getByRole("link", { name: "Download PDF", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send & see the result" }).click();
  await expect(page.locator(".cache-feedback")).toContainText(
    "24 replies delivered",
  );
  expect(errors).toEqual([]);
});

for (const failure of ["disabled", "blocked"] as const) {
  test(`career content stays readable when JavaScript is ${failure}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: failure !== "disabled",
    });
    const page = await context.newPage();
    if (failure === "blocked")
      await page.route("**/assets/*.js", (route) => route.abort());
    await page.goto("/#resume");
    await expect(
      page.getByRole("heading", { name: "Experience.", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download PDF", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Find me on LinkedIn" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Theme control loading" }),
    ).toBeDisabled();
    await context.close();
  });
}

test("prerendered markup hydrates in both themes without replacing career content", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const theme of ["dark", "light"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("portfolio-theme", value),
      theme,
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", {
        name:
          theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      }),
    ).toBeEnabled();
    await expect(page.locator("#intro-title")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
