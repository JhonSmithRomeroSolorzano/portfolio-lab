import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = resolve(directory, entry.name);
    return entry.isDirectory()
      ? files(name)
      : /\.(ts|tsx|mjs)$/.test(name)
        ? [name]
        : [];
  });
}

/** Check resolved imports, including re-exports and lazy imports, not naming conventions. */
test("maintained modules respect layer direction and never depend on retired UI", () => {
  const violations: string[] = [];
  for (const file of ["src", "server", "scripts"].flatMap((dir) =>
    files(resolve(root, dir)),
  )) {
    const from = relative(root, file).replaceAll("\\", "/");
    const ast = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function check(specifier: string) {
      if (!specifier.startsWith(".")) {
        if (from.startsWith("src/domain/"))
          violations.push(`${from} imports external ${specifier}`);
        return;
      }
      const target = relative(
        root,
        resolve(dirname(file), specifier),
      ).replaceAll("\\", "/");
      const feature = from.match(/^src\/features\/([^/]+)\//)?.[1];
      const allowed = target.startsWith("archive/")
        ? false
        : from.startsWith("src/domain/")
          ? target.startsWith("src/domain/")
          : from.startsWith("src/shared/")
            ? target.startsWith("src/shared/")
            : feature
              ? ["src/domain/", "src/shared/", `src/features/${feature}/`].some(
                  (prefix) => target.startsWith(prefix),
                )
              : from.startsWith("server/")
                ? ["server/", "src/domain/"].some((prefix) =>
                    target.startsWith(prefix),
                  )
                : from.startsWith("scripts/")
                  ? [
                      "scripts/",
                      "src/domain/",
                      "src/features/portfolio/data/",
                    ].some((prefix) => target.startsWith(prefix))
                  : true;
      if (!allowed) violations.push(`${from} → ${target}`);
    }
    function visit(node: ts.Node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        check(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        if (
          node.arguments.length === 1 &&
          ts.isStringLiteral(node.arguments[0])
        )
          check(node.arguments[0].text);
        else
          violations.push(
            `${from}: dynamic imports must have a statically verifiable target`,
          );
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  assert.deepEqual(violations, [], "Dependency direction violations");
});
