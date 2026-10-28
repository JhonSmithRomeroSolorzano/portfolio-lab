import type { Experience } from "./catalog";

type Destination = Pick<Experience, "id" | "title">;

export function ExperienceNavigation({
  title,
  previous,
  next,
}: {
  title: string;
  previous?: Destination;
  next?: Destination;
}) {
  return (
    <nav className="experience-navigation" aria-label={`${title} navigation`}>
      {previous && (
        <a className="experience-nav-previous" href={`#${previous.id}`}>
          <span className="experience-nav-direction">← Previous</span>
          <span>{previous.title}</span>
        </a>
      )}
      {next && (
        <a className="experience-nav-next" href={`#${next.id}`}>
          <span className="experience-nav-direction">Next →</span>
          <span>{next.title}</span>
        </a>
      )}
      <a className="experience-nav-collection" href="#collection">
        Back to collection
      </a>
    </nav>
  );
}
