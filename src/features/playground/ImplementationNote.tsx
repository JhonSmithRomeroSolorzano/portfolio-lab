import { SOURCE_REPOSITORY } from "../../shared/project";
import type { Experience } from "./catalog";

export function ImplementationNote({ experience }: { experience: Experience }) {
  return (
    <details className="implementation-note">
      <summary>How I built {experience.title}</summary>
      <div>
        <p>{experience.engineering.decision}</p>
        <p>{experience.engineering.tradeoff}</p>
        <p>
          <strong>What I check:</strong> {experience.engineering.verification}
        </p>
        <a
          href={`${SOURCE_REPOSITORY}/tree/main/${experience.engineering.source}`}
          target="_blank"
          rel="noreferrer"
        >
          Explore {experience.title} source ↗
        </a>
        <a
          href={`${SOURCE_REPOSITORY}/blob/main/ARCHITECTURE.md`}
          target="_blank"
          rel="noreferrer"
        >
          Read the architecture ↗
        </a>
      </div>
    </details>
  );
}
