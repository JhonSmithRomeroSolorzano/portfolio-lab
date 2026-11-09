import { readdirSync } from "node:fs";
import { resolve } from "node:path";

/** Discover source modules recursively before checking their dependency edges. */
export function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = resolve(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(name)
      : /\.(?:[cm]?[jt]s|[jt]sx)$/.test(name)
        ? [name]
        : [];
  });
}
