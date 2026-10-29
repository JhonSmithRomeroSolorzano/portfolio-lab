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

/** Recognize the observed origin-aware loader, with only request IDs varying. */
function isOriginAwareChallenge(code: string): boolean {
  const parameters = code.match(
    /window\.__CF\$cv\$params=\{r:'([a-f0-9]{16})',t:'([A-Za-z0-9+/]{1,64}={0,2})'\};/,
  );
  if (!parameters) return false;
  const [, ray, timestamp] = parameters;
  return (
    code ===
    "(function(){function c(){var b=a.contentDocument||(a.contentWindow&&a.contentWindow.document);" +
      "if(b){var d=b.createElement('script');" +
      `d.innerHTML="window.__CF$cv$params={r:'${ray}',t:'${timestamp}'};` +
      "var l=window.parent.location,o;try{o=new URL(l.origin).origin}catch(e){try{o=new URL(new URL(l.href).origin).origin}catch(e){o=''}}" +
      `var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js?ray=${ray}',a=document.createElement('script');` +
      "a.src=o?new URL(u,o).href:u;document.getElementsByTagName('head')[0].appendChild(a);\";" +
      "b.getElementsByTagName('head')[0].appendChild(d)}}" +
      "if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);" +
      "if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);" +
      "else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();"
  );
}

/** Sites adds this Cloudflare challenge immediately before the closing body. */
function withoutSitesChallenge(data: Uint8Array): string {
  return new TextDecoder()
    .decode(data)
    .replace(
      /<script>((?:(?!<\/script>)[\s\S])*)<\/script>(?=\s*<\/body>)/,
      (script: string, code: string) =>
        (code.startsWith("(function(){function c(){var b=a.contentDocument") &&
          code.includes("window.__CF$cv$params=") &&
          code.includes(
            "a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';",
          )) ||
        isOriginAwareChallenge(code)
          ? ""
          : script,
    );
}
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
  if (token) headers["OAI-Sites-Authorization"] = `Bearer ${token}`;
  async function read(path: string) {
    // Verify the canonical entry route without following the host's index redirect.
    const result = await fetch(
      new URL(path === "index.html" ? "./" : path, base),
      {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
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
    const data = await read(path);
    const content =
      base.origin === privatePreview && path === "index.html"
        ? withoutSitesChallenge(data)
        : data;
    if (digest(content) !== expected)
      throw new Error(`Deployed asset does not match release: ${path}.`);
  }
  return manifest;
}
