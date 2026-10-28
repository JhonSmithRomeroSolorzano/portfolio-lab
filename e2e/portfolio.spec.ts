import { test, expect } from "@playwright/test";
import { openMainNavigation } from "./helpers/main-navigation";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
});

test("recruiter can navigate by keyboard and download the verified resume", async ({
  page,
}) => {
  await page.goto("/?traffic=300#workbench");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await navigation
    .getByRole("link", { name: "Experience", exact: true })
    .press("Enter");
  await expect(page.locator("#resume")).toBeFocused();
  await expect(page).toHaveURL(/traffic=300#resume$/);
  const currentRole = page.locator(".experience-list > li").first();
  await expect(currentRole).toContainText("Antecursor");
  await expect(currentRole).toContainText("Codex, OpenCode, and ChatGPT");
  await expect(currentRole).toContainText("automated tests and checks");
  await expect(page.locator(".experience-list > li")).toHaveCount(6);
  await expect(page.locator(".experience-list > li").last()).toContainText(
    "Nov 2013",
  );
  await expect(page.locator(".experience-list > li").nth(1)).toContainText(
    "Remix",
  );
  await expect(page.getByText("RECENT PRACTICE", { exact: true })).toHaveCount(
    0,
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF", exact: true }).click();
  const pdf = await downloaded;
  expect(pdf.suggestedFilename()).toBe("jhon-smith-romero-resume.pdf");
  expect(await pdf.failure()).toBeNull();
  const plain = await page.request.get("/resume/jhon-smith-romero-resume.txt");
  expect(plain.ok()).toBeTruthy();
  expect(await plain.text()).toContain("Nimrod | https://nimrod.io/");
  expect(await plain.text()).toContain("Codex, OpenCode, and ChatGPT");
  expect(await plain.text()).toContain("mailto:jhon.smith@ucp.edu.co");
  const pdfResponse = await page.request.get(
    "/resume/jhon-smith-romero-resume.pdf",
  );
  const pdfSource = (await pdfResponse.body()).toString("latin1");
  expect(pdfSource.match(/\/Type \/Page\b/g)).toHaveLength(1);
  expect(pdfSource).toContain("/URI (mailto:jhon.smith@ucp.edu.co)");
  expect(pdfSource).toContain("/URI (tel:+573202065522)");
});

test("theme selection survives reload and a small viewport stays usable", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/#workbench");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Data Databases + cache" }).click();
  await expect(
    page.getByRole("region", { name: "Selected stack experience" }),
  ).toContainText("Strongest in NoSQL");
});

test("legacy About links still select Overview without losing query state", async ({
  page,
}) => {
  await page.goto("/?traffic=250#about");
  await expect(page.locator('nav a[href="#workbench"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  await expect(page.locator("#about")).toBeInViewport();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Labs & play" })
    .click();
  await expect(
    page.getByRole("slider", { name: "Engine speed", exact: true }),
  ).toBeVisible();
});

test("experience and contact precede the lab in document and menu order", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    await page
      .locator("main > section[id]")
      .evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual(["workbench", "resume", "contact", "lab"]);
  expect(
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))),
  ).toEqual(["#workbench", "#resume", "#contact", "#lab"]);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Experience", exact: true })
    .press("Enter");
  await expect(page.locator("#resume")).toBeInViewport();
});

test("mobile overview avoids duplicate actions and uses a compact menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#workbench");
  await expect(page.getByLabel("Core technologies")).toHaveText(
    "React · TypeScript · Node.js · Azure",
  );
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).not.toBeVisible();
  await openMainNavigation(page);
  const links = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link");
  await expect(links.first()).toHaveText("⌘ Overview");
  const rects = await links.evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { y: r.y, height: r.height };
    }),
  );
  expect(rects[0].y).toBeLessThan(rects[1].y);
  expect(rects[1].y).toBeLessThan(rects[2].y);
  expect(rects[2].y).toBeLessThan(rects[3].y);
  expect(rects.every((rect) => rect.height >= 44)).toBeTruthy();
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole("link", { name: "Explore my experience" }),
  ).toHaveCount(0);
  expect(
    await page
      .locator(".experience-project li")
      .first()
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(16);
});

test("sharing metadata is available without JavaScript and uses the public portfolio", async ({
  request,
}) => {
  const response = await request.get("/");
  const html = await response.text();
  const publicUrl = "https://jhonsmithromerosolorzano.github.io/portfolio-lab/";
  expect(html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0]).toContain(
    `href="${publicUrl}"`,
  );
  expect(html).toContain('property="og:title"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain(`${publicUrl}social-preview.jpg`);
  const image = await request.get("/social-preview.jpg");
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toContain("image/jpeg");
  expect((await image.body()).subarray(0, 3).toString("hex")).toBe("ffd8ff");
});
