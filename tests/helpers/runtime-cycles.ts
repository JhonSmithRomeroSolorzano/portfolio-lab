import { posix } from "node:path";
import ts from "typescript";
import { moduleDependencies } from "./architecture";

/** Resolve only supplied source modules; never read packages or the real disk. */
export function runtimeCycleViolations(
  modules: ReadonlyMap<string, string>,
): string[] {
  const root = "/portfolio";
  const relative = (path: string) => posix.relative(root, path);
  const declarations = /\.d\.(?:ts|mts|cts)$/;
  const host: ts.ModuleResolutionHost = {
    fileExists: (path) =>
      !declarations.test(path) && modules.has(relative(path)),
    readFile: (path) => modules.get(relative(path)),
  };
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    allowJs: true,
  };
  const files = [...modules.keys()].sort();
  const roots = new Set(files.map((file) => file.split("/")[0]));
  const graph = new Map<string, string[]>();
  const violations: string[] = [];
  for (const from of files) {
    const targets = new Set<string>();
    for (const { specifier, kind } of moduleDependencies(
      from,
      modules.get(from)!,
    )) {
      if (kind !== "eager" || !specifier?.startsWith(".")) continue;
      const target = posix.normalize(
        posix.join(posix.dirname(from), specifier),
      );
      // Assets and the existing external authoring exceptions are not source nodes.
      if (!roots.has(target.split("/")[0])) continue;
      if (posix.extname(target) && !/\.(?:[cm]?[jt]s|[jt]sx)$/.test(target))
        continue;
      const resolved = ts.resolveModuleName(
        specifier,
        posix.join(root, from),
        options,
        host,
      ).resolvedModule;
      if (resolved) targets.add(relative(resolved.resolvedFileName));
      else
        violations.push(
          `${from} → ${specifier}: unresolved eager source import`,
        );
    }
    graph.set(from, [...targets].sort());
  }

  // Sorted DFS reports concrete cycle witnesses, not every possible simple cycle.
  const visited = new Set<string>();
  const active = new Map<string, number>();
  const stack: string[] = [];
  function visit(file: string) {
    visited.add(file);
    active.set(file, stack.length);
    stack.push(file);
    for (const target of graph.get(file) ?? []) {
      const start = active.get(target);
      if (start !== undefined)
        violations.push(
          `Eager runtime cycle: ${[...stack.slice(start), target].join(" → ")}`,
        );
      else if (!visited.has(target)) visit(target);
    }
    stack.pop();
    active.delete(file);
  }
  for (const file of files) if (!visited.has(file)) visit(file);
  return violations;
}
