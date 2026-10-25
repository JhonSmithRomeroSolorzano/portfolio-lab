import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
function markdownIn(directory: string): string[] {
  if (!existsSync(resolve(root, directory))) return [];
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(
    (entry) => {
      if (entry.name.startsWith(".") || entry.name === "node_modules")
        return [];
      const path = `${directory}/${entry.name}`;
      return entry.isDirectory()
        ? markdownIn(path)
        : entry.isFile() && entry.name.endsWith(".md")
          ? [path]
          : [];
    },
  );
}
const documents = [
  ...readdirSync(root).filter((file) => file.endsWith(".md")),
  ...["src", "server", "scripts", "tests", "e2e", "archive", "docs"].flatMap(
    markdownIn,
  ),
];

/** Match the simple inline links and ATX headings used by repository docs. */
function checkLinks(path: string): string[] {
  const problems: string[] = [];
  for (const [, href] of read(path).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(href)) continue;
    const [file, fragment] = href.split("#");
    const target = file
      ? resolve(root, dirname(path), decodeURI(file))
      : resolve(root, path);
    if (!existsSync(target)) {
      problems.push(`${path}: missing ${href}`);
    } else if (fragment && target.endsWith(".md")) {
      const counts = new Map<string, number>();
      const anchors = [
        ...readFileSync(target, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm),
      ].map(([, heading]) => {
        const slug = heading
          .toLowerCase()
          .replace(/[^\p{L}\p{N}_\- ]/gu, "")
          .replaceAll(" ", "-");
        const count = counts.get(slug) ?? 0;
        counts.set(slug, count + 1);
        return count ? `${slug}-${count}` : slug;
      });
      if (!anchors.includes(decodeURI(fragment)))
        problems.push(`${path}: missing anchor ${href}`);
    }
  }
  return problems;
}

test("the three first-party guides have valid links and npm script names", () => {
  assert.deepEqual([...documents].sort(), [
    "AGENTS.md",
    "ARCHITECTURE.md",
    "README.md",
  ]);
  const { scripts } = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };
  const problems = documents.flatMap(checkLinks);
  for (const path of documents)
    for (const [, command] of read(path).matchAll(/\bnpm run ([\w:-]+)/g))
      if (!(command in scripts))
        problems.push(`${path}: unknown npm script ${command}`);
  assert.deepEqual(problems, []);
});

test("every bundled skill has discoverable metadata and valid local entrypoint links", () => {
  const skills = readdirSync(resolve(root, ".opencode/skills"), {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());
  assert.ok(skills.length > 0);
  for (const skill of skills) {
    const path = `.opencode/skills/${skill.name}/SKILL.md`;
    const source = read(path);
    const metadata = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(metadata, `${path}: missing frontmatter`);
    assert.match(metadata[1], new RegExp(`^name: ${skill.name}$`, "m"), path);
    assert.match(metadata[1], /^description: .+/m, path);
    assert.deepEqual(checkLinks(path), [], path);
    // Vendor entrypoints also name resources in code spans rather than links.
    for (const [, resource] of source.matchAll(
      /`((?:references|scripts|kit|templates|data)\/[^`\s]+)`/g,
    )) {
      if (/[<>{}*]/.test(resource)) continue;
      assert.ok(
        existsSync(resolve(root, dirname(path), resource)),
        `${path}: missing bundled resource ${resource}`,
      );
    }
  }
  for (const file of [
    ".opencode/skills/ui-ux-pro-max/scripts/search.py",
    ".opencode/skills/ui-ux-pro-max/data/stacks/react.csv",
    ".opencode/skills/anatomy/LICENSE",
    ".opencode/skills/anatomy/kit/iso-kit.mjs",
    ".opencode/skills/anatomy/kit/lathe.mjs",
    ".opencode/skills/anatomy/kit/audit.mjs",
  ])
    assert.ok(
      existsSync(resolve(root, file)),
      `Missing skill resource: ${file}`,
    );
});
