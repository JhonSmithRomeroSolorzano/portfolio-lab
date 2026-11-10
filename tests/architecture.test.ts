import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import test from "node:test";
import {
  allowedDependency,
  dependencyViolations,
} from "./helpers/architecture";
import { sourceFiles } from "./helpers/source-files";
import { runtimeCycleViolations } from "./helpers/runtime-cycles";

const root = resolve(import.meta.dirname, "..");

/** Check resolved imports, including re-exports and lazy imports, not naming conventions. */
test("maintained modules respect layer direction and never depend on retired UI", () => {
  const violations: string[] = [];
  for (const file of ["src", "server", "scripts"].flatMap((dir) =>
    sourceFiles(resolve(root, dir)),
  )) {
    const from = relative(root, file).replaceAll("\\", "/");
    violations.push(...dependencyViolations(from, readFileSync(file, "utf8")));
  }
  assert.deepEqual(violations, [], "Dependency direction violations");
});

test("maintained eager dependency graph has no cycles", () => {
  const modules = new Map(
    ["src", "server", "scripts"].flatMap((directory) =>
      sourceFiles(resolve(root, directory)).map(
        (file) =>
          [
            relative(root, file).replaceAll("\\", "/"),
            readFileSync(file, "utf8"),
          ] as const,
      ),
    ),
  );
  assert.deepEqual(
    runtimeCycleViolations(modules),
    [],
    "Eager dependency graph violations",
  );
});

test("dependency discovery checks nested JavaScript and TypeScript source formats", (t) => {
  const fixture = mkdtempSync(resolve(tmpdir(), "portfolio-architecture-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const directory = resolve(fixture, "src/shared/nested");
  mkdirSync(directory, { recursive: true });
  const extensions = ["ts", "tsx", "mts", "cts", "js", "jsx", "mjs", "cjs"];
  for (const extension of [...extensions, "css", "json", "txt"])
    writeFileSync(
      resolve(directory, `probe.${extension}`),
      'import "../../features/portfolio/data/profile";',
    );
  const discovered = sourceFiles(resolve(fixture, "src"));
  assert.deepEqual(
    discovered.map((file) => relative(directory, file)).sort(),
    extensions.map((extension) => `probe.${extension}`).sort(),
  );
  for (const file of discovered)
    assert.deepEqual(
      dependencyViolations(
        relative(fixture, file).replaceAll("\\", "/"),
        readFileSync(file, "utf8"),
      ),
      [
        `src/shared/nested/${relative(directory, file)} → ../../features/portfolio/data/profile`,
      ],
    );
});

test("dependency policy rejects inverted layers and browser/build boundary leaks", () => {
  const forbidden = [
    ["src/main.tsx", "../server/api"],
    ["src/app/App.tsx", "../../scripts/build-resume"],
    ["src/app/App.tsx", "../../archive/signal-lab/SignalLab"],
    ["src/app/App.tsx", "../../.opencode/skills/anatomy/kit/iso-kit.mjs"],
    ["src/main.tsx", "./app/prerender"],
    ["src/features/playground/Game.tsx", "../../app/prerender.tsx"],
    ["src/features/playground/Game.tsx", "../portfolio/ResumeSection"],
    ["src/shared/helper.ts", "../features/portfolio/data/profile"],
    ["src/domain/model.ts", "../shared/helper"],
    ["src/domain/model.ts", "node:fs"],
    ["src/app/App.tsx", "pdfkit"],
    ["src/shared/helper.ts", "node:fs"],
    ["src/features/playground/Game.tsx", "react-dom/server"],
    ["scripts/other.ts", "../src/app/prerender"],
    [
      "scripts/build-jet-engine.mjs",
      "../.opencode/skills/anatomy/kit/tube.mjs",
    ],
    ["server/api.ts", "../src/features/portfolio/data/profile"],
  ];
  for (const [from, target] of forbidden)
    assert.equal(allowedDependency(from, target), false, `${from} → ${target}`);
  const allowed = [
    ["src/main.tsx", "./app/App"],
    ["src/main.tsx", "react-dom/client"],
    ["src/app/prerender.tsx", "react-dom/server"],
    ["src/features/playground/Game.tsx", "../../domain/playground/model"],
    ["src/features/portfolio/ResumeSection.tsx", "react"],
    ["scripts/prerender.ts", "../src/app/prerender"],
    ["scripts/build-resume.ts", "../src/features/portfolio/data/profile"],
    [
      "scripts/build-jet-engine.mjs",
      "../.opencode/skills/anatomy/kit/audit.mjs",
    ],
    ["server/api.ts", "../src/domain/simulation/simulation.ts"],
    ["src/domain/playground/model.ts", "./other"],
  ];
  for (const [from, target] of allowed)
    assert.equal(allowedDependency(from, target), true, `${from} → ${target}`);
});

test("dependency inspection checks every module syntax instead of just static imports", () => {
  for (const source of [
    'import api from "../../server/api";',
    'export * from "../../server/api";',
    'import type { API } from "../../server/api";',
    'const api = import("../../server/api");',
    "const api = import(`../../server/api`);",
    'const api = require("../../server/api");',
    'import api = require("../../server/api");',
    'type API = import("../../server/api").API;',
    "const api = import(target);",
  ])
    assert.equal(
      dependencyViolations("src/app/App.tsx", source).length,
      1,
      source,
    );
  assert.deepEqual(
    dependencyViolations("src/app/App.tsx", 'import { useRef } from "react";'),
    [],
  );
});
