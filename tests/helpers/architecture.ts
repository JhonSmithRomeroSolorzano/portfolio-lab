import { posix } from "node:path";
import ts from "typescript";

/** Repository-relative paths; no filesystem access is needed to test the policy. */
export function allowedDependency(from: string, specifier: string): boolean {
  if (!specifier.startsWith(".")) {
    if (from.startsWith("src/domain/")) return false;
    if (!from.startsWith("src/")) return true;
    return (
      specifier === "react" ||
      (from === "src/main.tsx" && specifier === "react-dom/client") ||
      (from === "src/app/prerender.tsx" && specifier === "react-dom/server")
    );
  }
  const target = posix.normalize(posix.join(posix.dirname(from), specifier));
  const inside = (...prefixes: string[]) =>
    prefixes.some((prefix) => target.startsWith(prefix));
  // The server renderer is build-only, even though it lives beside App.
  if (/^src\/app\/prerender(?:\.[cm]?[jt]sx?)?$/.test(target))
    return from === "scripts/prerender.ts";
  if (from.startsWith("src/domain/")) return inside("src/domain/");
  if (from.startsWith("src/shared/")) return inside("src/shared/");
  const feature = from.match(/^src\/features\/([^/]+)\//)?.[1];
  if (feature)
    return inside("src/domain/", "src/shared/", `src/features/${feature}/`);
  if (from === "src/main.tsx" || from.startsWith("src/app/"))
    return inside("src/app/", "src/features/", "src/shared/", "src/domain/");
  if (from.startsWith("server/")) return inside("server/", "src/domain/");
  if (from.startsWith("scripts/"))
    return (
      (from === "scripts/build-jet-engine.mjs" &&
        ["iso-kit.mjs", "lathe.mjs", "audit.mjs"].some(
          (name) => target === `.opencode/skills/anatomy/kit/${name}`,
        )) ||
      inside("scripts/", "src/domain/", "src/features/portfolio/data/")
    );
  return false;
}

/** Inspect all supported module edges, including type-only and lazy imports. */
export function dependencyViolations(from: string, source: string): string[] {
  const violations: string[] = [];
  const ast = ts.createSourceFile(from, source, ts.ScriptTarget.Latest, true);
  function check(node: ts.Node | undefined) {
    if (!node || !ts.isStringLiteralLike(node)) {
      violations.push(
        `${from}: imports must have a statically verifiable target`,
      );
    } else if (!allowedDependency(from, node.text)) {
      violations.push(`${from} → ${node.text}`);
    }
  }
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    )
      check(node.moduleSpecifier);
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      check(node.moduleReference.expression);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    )
      check(node.arguments[0]);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      check(node.argument.literal);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return violations;
}
