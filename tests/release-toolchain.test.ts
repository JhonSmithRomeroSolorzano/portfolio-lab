import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the CI browser image matches the installed Playwright release", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/deploy.yml", import.meta.url),
    "utf8",
  );
  const image = workflow.match(
    /image: mcr\.microsoft\.com\/playwright:v([\d.]+)-noble@sha256:([a-f\d]{64})\s/,
  );
  assert.ok(image, "Pin the official browser image by version and digest.");
  const { version } = JSON.parse(
    readFileSync(
      new URL("../node_modules/@playwright/test/package.json", import.meta.url),
      "utf8",
    ),
  ) as { version: string };
  assert.equal(
    image[1],
    version,
    "Update the CI image tag and verified digest with @playwright/test so its browser executables match.",
  );
});
