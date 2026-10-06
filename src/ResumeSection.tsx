import { certifications, education, experience, LINKEDIN } from "./profile";
import "./resume.css";

export function ResumeSection() {
  return (
    <section
      className="resume-section wrap"
      id="resume"
      aria-labelledby="resume-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <span className="section-index">03 /</span> THE RÉSUMÉ
          </span>
          <h2 id="resume-title">
            Experience behind
            <br />
            <em>the work.</em>
          </h2>
        </div>
        <a
          className="text-link"
          href={LINKEDIN}
          target="_blank"
          rel="noreferrer"
        >
          Full profile on LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="resume-layout">
        <aside className="resume-overview" aria-label="Professional overview">
          <div className="resume-card">
            <span className="eyebrow">JHON SMITH ROMERO</span>
            <h3>Senior full-stack developer</h3>
            <p>
              7+ years in software development, connecting JavaScript interfaces
              with the services and data behind them.
            </p>
            <p className="resume-location">Pereira, Colombia</p>
            <div className="tags" aria-label="Core technologies">
              {[
                "JavaScript",
                "TypeScript",
                "React",
                "Node.js",
                "NoSQL",
                "SQL",
              ].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
          <div className="resume-study">
            <h3>Education</h3>
            {education.map((item) => (
              <article key={item.school}>
                <p className="resume-period">{item.period}</p>
                <h4>{item.qualification}</h4>
                <p>{item.school}</p>
              </article>
            ))}
          </div>
          <div className="resume-study">
            <h3>Selected certifications</h3>
            {certifications.map((item) => (
              <article key={item.title}>
                <p className="resume-period">
                  {item.issuer} · {item.date}
                </p>
                <h4>{item.title}</h4>
              </article>
            ))}
          </div>
        </aside>
        <div className="resume-experience">
          <h3 className="resume-list-title">Selected experience</h3>
          <ol className="experience-list">
            {experience.map((job) => (
              <li key={`${job.employer}-${job.start}`}>
                <article>
                  <div className="experience-meta">
                    <p className="resume-period">
                      <time dateTime={job.start}>{job.startLabel}</time>
                      <span aria-hidden="true"> — </span>
                      <span className="sr-only"> to </span>
                      {job.end ? (
                        <time dateTime={job.end}>{job.endLabel}</time>
                      ) : (
                        job.endLabel
                      )}
                    </p>
                    {job.end === null && (
                      <span className="current-role">Current</span>
                    )}
                  </div>
                  <h4>{job.role}</h4>
                  <p className="experience-employer">{job.employer}</p>
                  <p className="experience-context">{job.context}</p>
                  {job.highlights.length > 0 && (
                    <ul>
                      {job.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
