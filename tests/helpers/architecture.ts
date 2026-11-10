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

export type ModuleDependency = {
  specifier: string | undefined;
  kind: "eager" | "lazy" | "type";
};

/** Syntactically deferred loads; this does not evaluate call sites or branches. */
function deferredLoad(node: ts.Node): boolean {
  let child = node;
  for (
    let parent = node.parent;
    parent;
    child = parent, parent = parent.parent
  ) {
    if (
      ts.isFunctionLike(parent) &&
      (("body" in parent && parent.body === child) ||
        parent.parameters.some((parameter) => parameter === child))
    )
      return true;
    if (
      ts.isPropertyDeclaration(parent) &&
      parent.initializer === child &&
      !parent.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
      )
    )
      return true;
  }
  return false;
}

/** Share one AST inspection for layer policy and runtime graph classification. */
export function moduleDependencies(
  from: string,
  source: string,
): ModuleDependency[] {
  const dependencies: ModuleDependency[] = [];
  const ast = ts.createSourceFile(from, source, ts.ScriptTarget.Latest, true);
  function add(node: ts.Node | undefined, kind: ModuleDependency["kind"]) {
    dependencies.push({
      specifier: node && ts.isStringLiteralLike(node) ? node.text : undefined,
      kind: ast.isDeclarationFile ? "type" : kind,
    });
  }
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node))
      add(
        node.moduleSpecifier,
        node.importClause?.isTypeOnly ? "type" : "eager",
      );
    if (ts.isExportDeclaration(node) && node.moduleSpecifier)
      add(node.moduleSpecifier, node.isTypeOnly ? "type" : "eager");
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    )
      add(node.moduleReference.expression, node.isTypeOnly ? "type" : "eager");
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    )
      add(
        node.arguments[0],
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          deferredLoad(node)
          ? "lazy"
          : "eager",
      );
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      add(node.argument.literal, "type");
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return dependencies;
}

/** Layer restrictions still apply to every edge, not just eager runtime imports. */
export function dependencyViolations(from: string, source: string): string[] {
  return moduleDependencies(from, source).flatMap(({ specifier }) =>
    specifier === undefined
      ? [`${from}: imports must have a statically verifiable target`]
      : allowedDependency(from, specifier)
        ? []
        : [`${from} → ${specifier}`],
  );
}
