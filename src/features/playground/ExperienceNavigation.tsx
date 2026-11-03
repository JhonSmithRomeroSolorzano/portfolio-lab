export function ExperienceNavigation({ title }: { title: string }) {
  return (
    <nav className="experience-navigation" aria-label={`${title} navigation`}>
      <a className="experience-nav-collection" href="#collection">
        Back to labs ↑
      </a>
    </nav>
  );
}
