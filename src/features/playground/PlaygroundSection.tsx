import { experiences } from "./catalog";
import { DeferredExperiment } from "./DeferredExperiment";

export function PlaygroundSection() {
  return (
    <section
      className="lab-section lab-collection wrap"
      id="lab"
      tabIndex={-1}
      aria-labelledby="lab-title"
    >
      <span className="section-signal" aria-hidden="true" />
      <div className="section-heading" data-reveal="0">
        <div>
          <span className="eyebrow">A PLACE TO EXPLORE</span>
          <h2 id="lab-title">
            Labs & play<span className="heading-dot">.</span>
          </h2>
        </div>
        <p>
          Try an idea. Follow your curiosity. A few small things I’ve built for
          you to get your hands on.
        </p>
      </div>
      <nav className="collection-index" aria-label="Explore the collection">
        {experiences.map((experience, index) => (
          <a
            key={experience.id}
            href={`#${experience.id}`}
            className={`collection-card card-${experience.style}`}
          >
            <span
              className={`collection-mini mini-${experience.style}`}
              aria-hidden="true"
            >
              {experience.artwork[0]}
              <b>{experience.artwork[1]}</b>
              {experience.artwork[2]}
            </span>
            <span className="collection-number">
              {String(index + 1).padStart(2, "0")} / {experience.category}
            </span>
            <strong>{experience.title}</strong>
            <span className="collection-description">
              {experience.description}
            </span>
            <span className="collection-go" aria-hidden="true">
              {experience.action}
            </span>
          </a>
        ))}
      </nav>
      {experiences.map((experience) => (
        <article
          key={experience.id}
          className="play-exhibit"
          id={experience.id}
          tabIndex={-1}
          aria-labelledby={experience.titleId}
        >
          <DeferredExperiment {...experience} />
        </article>
      ))}
    </section>
  );
}
