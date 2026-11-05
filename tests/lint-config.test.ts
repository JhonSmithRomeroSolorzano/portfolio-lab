import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { relative } from "node:path";
import test from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

test("lint glob discovery retains nested paths and brace alternatives", async () => {
  const results = await eslint.lintFiles([
    "scripts/{build-resume,profile-engine}.{ts,mjs}",
    "src/**/App.tsx",
  ]);
  assert.deepEqual(
    results
      .map(({ filePath }) =>
        relative(process.cwd(), filePath).replaceAll("\\", "/"),
      )
      .sort(),
    [
      "scripts/build-resume.ts",
      "scripts/profile-engine.mjs",
      "src/app/App.tsx",
    ],
  );
  for (const result of results)
    assert.deepEqual(result.messages, [], result.filePath);
});

test("all first-party MJS tooling and future JavaScript receive recommended lint rules", async () => {
  const scripts = readdirSync(new URL("../scripts/", import.meta.url))
    .filter((file) => file.endsWith(".mjs"))
    .map((file) => `scripts/${file}`);
  for (const file of [
    "eslint.config.mjs",
    ...scripts,
    "scripts/future-tool.js",
    "scripts/future-tool.cjs",
  ]) {
    const config = await eslint.calculateConfigForFile(file);
    assert.equal(config.rules["no-undef"][0], 2, file);
    assert.equal(config.rules["no-unused-vars"][0], 2, file);
    assert.equal(config.languageOptions.globals.process, "readonly", file);
  }
});

test("JavaScript lint catches undefined names, unused bindings, and global reassignment", async () => {
  const [result] = await eslint.lintText(
    'const unused = 1;\nmissingTool();\nprocess = {};\ndocument.querySelector("main");',
    { filePath: "scripts/lint-fixture.mjs" },
  );
  assert.deepEqual(
    result.messages.map(({ ruleId }) => ruleId).sort(),
    ["no-global-assign", "no-undef", "no-undef", "no-unused-vars"].sort(),
  );
});

test("Node tooling APIs and serialized browser callbacks lint without browser-global leakage", async () => {
  const [result] = await eslint.lintText(
    `export async function inspect(page) {
      const response = await fetch(new URL(process.argv[2]), {
        signal: AbortSignal.timeout(1000),
      });
      console.log(response.status, performance.now(), new AbortController());
      const timer = setTimeout(() => console.log("ready"), 10);
      clearTimeout(timer);
      return page.evaluate(() => globalThis.document.visibilityState);
    }`,
    { filePath: "scripts/lint-fixture.mjs" },
  );
  assert.deepEqual(result.messages, []);
  const application = await eslint.calculateConfigForFile("src/app/future.js");
  assert.equal(application.languageOptions.globals?.process, undefined);
  assert.equal(application.languageOptions.globals?.document, undefined);
});

test("lint coverage preserves TypeScript rules and vendor/generated exclusions", async () => {
  const component = await eslint.calculateConfigForFile("src/app/App.tsx");
  assert.equal(component.rules["@typescript-eslint/no-unused-vars"][0], 2);
  assert.equal(component.rules["react-hooks/rules-of-hooks"][0], 2);
  for (const file of [
    ".opencode/skills/anatomy/kit/iso-kit.mjs",
    "archive/signal-lab/future.mjs",
    "dist/future.js",
    "artifacts/future.mjs",
    "test-results/future.js",
    "public/resume/future.js",
  ])
    assert.equal(await eslint.isPathIgnored(file), true, file);
});
