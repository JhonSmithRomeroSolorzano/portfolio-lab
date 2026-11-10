import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import {
  dependencyViolations,
  moduleDependencies,
} from "./helpers/architecture";
import { runtimeCycleViolations } from "./helpers/runtime-cycles";

const check = (files: Record<string, string>) =>
  runtimeCycleViolations(new Map(Object.entries(files)));

test("runtime classification matches the repository's verbatim bundler configuration", () => {
  const { compilerOptions } = JSON.parse(
    readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"),
  );
  assert.equal(compilerOptions.verbatimModuleSyntax, true);
  assert.equal(compilerOptions.moduleResolution, "Bundler");
  assert.equal(compilerOptions.module, "ESNext");
  assert.equal(compilerOptions.paths, undefined);
  assert.equal(compilerOptions.baseUrl, undefined);
});

test("AST inspection distinguishes eager, erased type, and syntactically deferred edges", () => {
  const cases: [string, "eager" | "lazy" | "type"][] = [
    ['import "./b";', "eager"],
    ['import {} from "./b";', "eager"],
    ['import B from "./b";', "eager"],
    ['import { type B } from "./b";', "eager"],
    ['import { b, type B } from "./b";', "eager"],
    ['export * from "./b";', "eager"],
    ['export * as b from "./b";', "eager"],
    ['export { type B } from "./b";', "eager"],
    ['import B = require("./b");', "eager"],
    ['const b = require("./b");', "eager"],
    ['if (enabled) require("./b");', "eager"],
    ['class C { static b = require("./b"); }', "eager"],
    ['class C { static { require("./b"); } }', "eager"],
    ['class C { [require("./b")]() {} }', "eager"],
    ['import type { B } from "./b";', "type"],
    ['import type B = require("./b");', "type"],
    ['export type { B } from "./b";', "type"],
    ['export type * from "./b";', "type"],
    ['type B = import("./b").B;', "type"],
    ['const b = import("./b");', "lazy"],
    ['const b = await import("./b");', "lazy"],
    ['const load = () => require("./b");', "lazy"],
    ['function load(b = require("./b")) {}', "lazy"],
    ['class C { b = require("./b"); }', "lazy"],
    ['class C { load() { return require("./b"); } }', "lazy"],
  ];
  for (const [source, kind] of cases)
    assert.deepEqual(
      moduleDependencies("src/a.ts", source),
      [{ specifier: "./b", kind }],
      source,
    );
  assert.deepEqual(
    moduleDependencies("src/a.d.ts", 'export { B } from "./b";'),
    [{ specifier: "./b", kind: "type" }],
  );
});

test("type modifiers follow actual compiler emit rather than named-specifier heuristics", () => {
  for (const source of [
    'import { type B } from "./b";',
    'export { type B } from "./b";',
  ]) {
    const emitted = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        verbatimModuleSyntax: true,
      },
    }).outputText;
    assert.equal(moduleDependencies("src/a.js", emitted)[0].kind, "eager");
    assert.match(emitted, /from "\.\/b"/);
  }
});

test("cycles report self-imports, longer paths and re-export barrels", () => {
  assert.deepEqual(check({ "src/self.ts": 'import "./self";' }), [
    "Eager runtime cycle: src/self.ts → src/self.ts",
  ]);
  assert.deepEqual(
    check({
      "src/a.ts": 'import "./barrel";',
      "src/barrel/index.ts": 'export * from "../b";',
      "src/b.ts": 'import "./a";',
    }),
    [
      "Eager runtime cycle: src/a.ts → src/barrel/index.ts → src/b.ts → src/a.ts",
    ],
  );
});

test("resolution supports explicit formats, extensionless imports and JavaScript-to-TypeScript substitutions", () => {
  for (const [from, to, specifier] of [
    ["a.ts", "b.tsx", "./b"],
    ["a.ts", "b.ts", "./b.js"],
    ["a.jsx", "b.jsx", "./b.jsx"],
    ["a.mts", "b.mts", "./b.mjs"],
    ["a.cts", "b.cts", "./b.cjs"],
    ["a.mjs", "b.mjs", "./b.mjs"],
    ["a.cjs", "b.cjs", "./b.cjs"],
    ["a.js", "b.js", "./b.js"],
  ]) {
    const load = (file: string, target: string) =>
      /\.(?:cjs|cts)$/.test(file)
        ? `require("${target}");`
        : `import "${target}";`;
    const files = {
      [`src/${from}`]: load(from, specifier),
      [`src/${to}`]: load(to, `./${from}`),
    };
    assert.deepEqual(check(files), [
      `Eager runtime cycle: src/${from} → src/${to} → src/${from}`,
    ]);
  }
});

test("declaration files cannot mask runtime JavaScript cycles", () => {
  assert.deepEqual(
    check({
      "src/a.js": 'import "./b.js";',
      "src/b.d.ts": "export declare const b: string;",
      "src/b.js": 'import "./a.js";',
    }),
    ["Eager runtime cycle: src/a.js → src/b.js → src/a.js"],
  );
});

test("type-only and deferred back-edges do not create eager cycles or escape layer policy", () => {
  for (const back of [
    'import type { A } from "./a";',
    'export type { A } from "./a";',
    'type A = import("./a").A;',
    'const a = import("./a");',
    'function load() { return require("./a"); }',
  ])
    assert.deepEqual(
      check({ "src/a.ts": 'import "./b";', "src/b.ts": back }),
      [],
    );
  for (const source of [
    'import type { API } from "../../server/api";',
    'const api = import("../../server/api");',
    'function load() { return require("../../server/api"); }',
    "const api = import(target);",
  ])
    assert.equal(
      dependencyViolations("src/app/a.ts", source).length,
      1,
      source,
    );
});

test("acyclic diamonds, external packages, assets and external authoring nodes are not cycles", () => {
  assert.deepEqual(
    check({
      "src/a.ts":
        'import "./b"; import "./c"; import "react"; import "./style.css";',
      "src/b.ts": 'import "./d";',
      "src/c.ts": 'export * from "./d";',
      "src/d.ts": "export const d = 1;",
      "scripts/art.mjs":
        'import "../.opencode/skills/anatomy/kit/iso-kit.mjs";',
    }),
    [],
  );
});

test("unresolved eager source imports fail rather than silently breaking the graph", () => {
  assert.deepEqual(check({ "src/a.ts": 'import "./missing";' }), [
    "src/a.ts → ./missing: unresolved eager source import",
  ]);
});

test("cycle diagnostics are deterministic and deduplicate repeated imports", () => {
  const files = {
    "src/c.ts": 'import "./a";',
    "src/b.ts": 'import "./c";',
    "src/a.ts": 'import "./b"; export * from "./b";',
    "server/x.ts": 'import "./x";',
  };
  const expected = [
    "Eager runtime cycle: server/x.ts → server/x.ts",
    "Eager runtime cycle: src/a.ts → src/b.ts → src/c.ts → src/a.ts",
  ];
  assert.deepEqual(check(files), expected);
  assert.deepEqual(
    check(Object.fromEntries(Object.entries(files).reverse())),
    expected,
  );
});
