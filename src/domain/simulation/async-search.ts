import { modelInteger } from "./model-input";
export type ResponsePolicy = "every" | "latest";
export function searchResponses(
  oldDelay: number,
  newestDelay: number,
  policy: ResponsePolicy,
) {
  modelInteger(oldDelay, 50, 1000);
  modelInteger(newestDelay, 50, 1000);
  if (!["every", "latest"].includes(policy))
    throw new RangeError("Unknown response policy.");
  const requests = [
    { id: 1, at: 0, query: "r", delay: oldDelay },
    { id: 2, at: 100, query: "re", delay: 250 },
    { id: 3, at: 200, query: "react", delay: newestDelay },
  ];
  const events = requests
    .flatMap((r) => [
      { ...r, kind: "input" as const },
      { ...r, at: r.at + r.delay, kind: "response" as const },
    ])
    .sort(
      (a, b) =>
        a.at - b.at ||
        (a.kind === b.kind ? a.id - b.id : a.kind === "input" ? -1 : 1),
    );
  let latest = 0,
    visible = "",
    ignored = 0;
  const rows = events.map((e) => {
    if (e.kind === "input") latest = e.id;
    const applied =
      e.kind === "response" && (policy === "every" || e.id === latest);
    if (applied) visible = e.query;
    if (e.kind === "response" && !applied) ignored++;
    return { ...e, applied, visible };
  });
  return { rows, visible, ignored, stale: visible !== requests.at(-1)!.query };
}
