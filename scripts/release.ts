import { createHash } from "node:crypto";

export type Release = {
  version: 1;
  source: string;
  files: Record<string, string>;
};
export const privatePreview =
  "https://jhon-romero-portfolio-lab.jhoninho09.chatgpt.site";
export const digest = (data: string | Uint8Array) =>
  createHash("sha256").update(data).digest("hex");
export function parseRelease(value: unknown): Release {
  const data = value as Release;
  if (
    data?.version !== 1 ||
    !/^[a-f0-9]{40}$/.test(data.source) ||
    !data.files ||
    typeof data.files !== "object" ||
    Array.isArray(data.files)
  )
    throw new Error("Invalid release manifest.");
  const files = Object.entries(data.files);
  if (
    !files.length ||
    files.length > 100 ||
    !data.files["index.html"] ||
    !files.some(([name]) => name.endsWith(".js"))
  )
    throw new Error("Incomplete release manifest.");
  for (const [name, hash] of files) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(name) ||
      name.split("/").some((part) => !part || part === "." || part === "..") ||
      !/^[a-f0-9]{64}$/.test(hash)
    )
      throw new Error("Invalid release asset.");
  }
  return data;
}

/** Authentication is scoped to the existing owner-private origin; never follow redirects. */
export async function verifyRelease(
  base: URL,
  source: string,
  token?: string,
): Promise<Release> {
  if (token && base.origin !== privatePreview)
    throw new Error("Private credentials cannot be sent to this origin.");
  if (!["https:", "http:"].includes(base.protocol))
    throw new Error("Expected an HTTP(S) deployment.");
  const headers: Record<string, string> = { "Cache-Control": "no-cache" };
  if (token) headers["OAI-Sites-Authorization"] = token;
  async function read(path: string) {
    const result = await fetch(new URL(path, base), {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok)
      throw new Error(`Deployment returned HTTP ${result.status} for ${path}.`);
    return new Uint8Array(await result.arrayBuffer());
  }
  const manifest = parseRelease(
    JSON.parse(new TextDecoder().decode(await read("release.json"))),
  );
  if (manifest.source !== source)
    throw new Error(
      `Deployment is serving a different source commit: ${manifest.source}.`,
    );
  for (const [path, expected] of Object.entries(manifest.files)) {
    if (digest(await read(path)) !== expected)
      throw new Error(`Deployed asset does not match release: ${path}.`);
  }
  return manifest;
}
