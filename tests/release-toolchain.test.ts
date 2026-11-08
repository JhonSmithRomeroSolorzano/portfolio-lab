import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/deploy.yml", import.meta.url),
  "utf8",
);

test("the CI browser image matches the installed Playwright release", () => {
  const images = [
    ...workflow.matchAll(
      /image: mcr\.microsoft\.com\/playwright:v([\d.]+)-noble@sha256:([a-f\d]{64})\s/g,
    ),
  ];
  assert.equal(images.length, 2, "Pin both preparation and validation images.");
  const { version } = JSON.parse(
    readFileSync(
      new URL("../node_modules/@playwright/test/package.json", import.meta.url),
      "utf8",
    ),
  ) as { version: string };
  for (const image of images)
    assert.equal(
      image[1],
      version,
      "Update the CI image tag and verified digest with @playwright/test so its browser executables match.",
    );
  assert.equal(images[0][2], images[1][2]);
});

function job(name: string) {
  const section = workflow.match(
    new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  \\w+:|$(?![\\s\\S]))`, "m"),
  );
  assert.ok(section, `Missing job ${name}.`);
  return section[1];
}

test("runtime, Node declarations, and every Node CI job share the supported release line", () => {
  const readJson = (path: string) =>
    JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  const pkg = readJson("../package.json");
  const lock = readJson("../package-lock.json");
  assert.equal(pkg.engines.node, ">=26.13.0 <27");
  assert.equal(lock.packages[""].engines.node, pkg.engines.node);
  assert.match(pkg.devDependencies["@types/node"], /^\^26\./);
  assert.match(lock.packages["node_modules/@types/node"].version, /^26\./);
  const runtimes = [...workflow.matchAll(/node-version: "([^"]+)"/g)];
  assert.equal(runtimes.length, 3);
  for (const runtime of runtimes) assert.equal(runtime[1], "26.13.0");
  for (const name of ["prepare", "validate", "verify"])
    assert.match(job(name), /node-version: "26\.13\.0"/);
});

test("release validates one shared build in isolated jobs without weakening gates", () => {
  const prepare = job("prepare");
  const validate = job("validate");
  const build = job("build");
  assert.match(prepare, /run: npm audit --audit-level=high/);
  assert.match(prepare, /run: npm run check/);
  assert.match(
    prepare,
    /name: production-dist\n\s+path: dist\/\n\s+if-no-files-found: error/,
  );
  assert.match(validate, /needs: prepare/);
  assert.match(validate, /fail-fast: false/);
  assert.match(validate, /suite: \[chromium, webkit, performance\]/);
  assert.match(
    validate,
    /if: matrix.suite != 'performance'\n\s+run: npm run test:browser -- --project=\$\{\{ matrix.suite \}\}/,
  );
  assert.match(
    validate,
    /if: matrix.suite == 'performance'\n\s+run: npm run audit:ci/,
  );
  assert.match(
    validate,
    /name: validation-diagnostics-\$\{\{ matrix.suite \}\}/,
  );
  assert.match(build, /if: \$\{\{ always\(\) \}\}/);
  assert.match(build, /needs: \[prepare, validate\]/);
  for (const section of [validate, build]) {
    assert.match(
      section,
      /name: production-dist\n\s+path: dist\/\n\s+digest-mismatch: error/,
    );
    assert.doesNotMatch(section, /run: npm run (check|build)/);
  }
  assert.match(job("deploy"), /needs: build/);
  assert.match(job("verify"), /needs: deploy/);
  assert.doesNotMatch(workflow, /continue-on-error/);
  for (const section of [prepare, validate, build])
    assert.match(section, /timeout-minutes: 20/);
});

test("the required build check rejects failed, skipped, or cancelled validation", () => {
  const build = job("build");
  assert.match(build, /PREPARE_RESULT: \$\{\{ needs.prepare.result \}\}/);
  assert.match(build, /VALIDATE_RESULT: \$\{\{ needs.validate.result \}\}/);
  const guard = build.match(/run: \|\n((?: {10}.+\n)+)/);
  assert.ok(guard, "Keep the aggregate result guard explicit.");
  const script = guard[1].replace(/^ {10}/gm, "");
  for (const prepare of ["success", "failure", "skipped", "cancelled", ""]) {
    for (const validate of ["success", "failure", "skipped", "cancelled", ""]) {
      const result = spawnSync("sh", ["-e", "-c", script], {
        env: {
          ...process.env,
          PREPARE_RESULT: prepare,
          VALIDATE_RESULT: validate,
        },
      });
      assert.ifError(result.error);
      assert.equal(
        result.status === 0,
        prepare === "success" && validate === "success",
        `${prepare}/${validate}`,
      );
    }
  }
});
