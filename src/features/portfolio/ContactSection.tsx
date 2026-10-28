import { Arrow } from "../../shared/ui/Arrow";
import { LINKEDIN, verifiedContactDetails } from "./data/profile";

export function ContactSection() {
  return (
    <section
      className="contact-section wrap"
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-title"
      data-reveal="0"
    >
      <span className="section-signal" aria-hidden="true" />
      <span className="eyebrow">GET IN TOUCH</span>
      <div>
        <h2 id="contact-title">Let’s talk.</h2>
        <div className="contact-actions">
          {verifiedContactDetails.map((detail) => (
            <a
              key={detail.href}
              className="primary-button"
              href={detail.href}
              rel="noreferrer"
            >
              <span>{detail.label}</span> <Arrow diagonal />
            </a>
          ))}
          <a
            className="primary-button"
            href={LINKEDIN}
            target="_blank"
            rel="noreferrer"
          >
            <span>Find me on LinkedIn</span> <Arrow diagonal />
          </a>
        </div>
      </div>
      <p>
        Open to full-stack opportunities with JavaScript, TypeScript, React, and
        Node.js.
      </p>
    </section>
  );
}
