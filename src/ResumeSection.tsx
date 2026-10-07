import {
  certifications,
  education,
  experience,
  LINKEDIN,
  professionalProfile,
} from "./profile";
import { resumeTechnologyGroups, resumeDownloads } from "./resume-data";
import "./resume.css";

export function ResumeSection() {
  return (
    <section
      className="resume-section wrap"
      id="resume"
      tabIndex={-1}
      aria-labelledby="resume-title"
    >
      <span className="section-signal" aria-hidden="true" />
      <div className="section-heading" data-reveal="0">
        <div>
          <span className="eyebrow">CAREER & EDUCATION</span>
          <h2 id="resume-title">Experience.</h2>
        </div>
        <div className="resume-actions" aria-label="Resume resources">
          <a
            className="text-link resume-download"
            href={`./resume/${resumeDownloads.pdf}`}
            download={resumeDownloads.pdf}
          >
            Download PDF <span aria-hidden="true">↓</span>
          </a>
          <a
            className="text-link"
            href={`./resume/${resumeDownloads.text}`}
            download={resumeDownloads.text}
          >
            Plain text <span aria-hidden="true">↓</span>
          </a>
          <a
            className="text-link"
            href={LINKEDIN}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="resume-layout">
        <aside className="resume-overview" aria-label="Professional overview">
          <div className="resume-card" data-reveal="0">
            <span className="eyebrow">
              {professionalProfile.name.toUpperCase()}
            </span>
            <h3>{professionalProfile.role}</h3>
            <p>{professionalProfile.summary}</p>
            <p className="resume-location">{professionalProfile.location}</p>
            <div className="resume-technologies" aria-label="Core technologies">
              {resumeTechnologyGroups.map((group) => (
                <div className="resume-technology-group" key={group.name}>
                  <h4>{group.name}</h4>
                  <ul className="tags" aria-label={group.name}>
                    {group.items.map((skill) => (
                      <li key={skill}>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="resume-study">
            <h3>Education</h3>
            {education.map((item) => (
              <article key={item.school} data-reveal="40">
                <p className="resume-period">{item.period}</p>
                <h4>{item.qualification}</h4>
                <p>{item.school}</p>
              </article>
            ))}
          </div>
          <div className="resume-study">
            <h3>Selected certifications</h3>
            {certifications.map((item) => (
              <article key={item.title} data-reveal="40">
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
            {experience.map((job, index) => (
              <li key={`${job.employer}-${job.start}`}>
                <article data-reveal={(index % 3) * 50}>
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
                  {job.highlights && job.highlights.length > 0 && (
                    <ul>
                      {job.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {job.projects?.map((project) => (
                    <div className="experience-project" key={project.name}>
                      <span className="eyebrow">MY CONTRIBUTIONS</span>
                      <h5>
                        <a href={project.url} target="_blank" rel="noreferrer">
                          {project.name} <span aria-hidden="true">↗</span>
                        </a>
                      </h5>
                      <p>{project.description}</p>
                      <ul>
                        {project.contributions.map((contribution) => (
                          <li key={contribution}>{contribution}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
