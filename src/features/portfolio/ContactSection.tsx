import { Arrow } from "../../shared/ui/Arrow";
import { LINKEDIN } from "./data/profile";

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
        <a
          className="primary-button"
          href={LINKEDIN}
          target="_blank"
          rel="noreferrer"
        >
          Find me on LinkedIn <Arrow diagonal />
        </a>
      </div>
      <p>
        Open to full-stack opportunities with JavaScript, TypeScript, React, and
        Node.js.
      </p>
    </section>
  );
}
