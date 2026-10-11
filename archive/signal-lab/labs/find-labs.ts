import { LABS } from "../lab-catalog";
import type { LAB_AREAS } from "../lab-catalog";
export type LabArea = (typeof LAB_AREAS)[number];
export function findLabs(query: string, area: LabArea | "All") {
  const terms = query
    .trim()
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean);
  return LABS.filter(
    (lab) =>
      (area === "All" || lab.area === area) &&
      terms.every((term) =>
        `${lab.name} ${lab.area} ${lab.detail}`
          .toLocaleLowerCase("en")
          .includes(term),
      ),
  );
}
