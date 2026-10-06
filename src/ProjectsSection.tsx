import "./projects.css";

// Contribution and stack confirmed directly by Jhon on October 6, 2026.
// Public product context: https://www.linkedin.com/company/athletifyofficial
export function ProjectsSection() {
  return (
    <section
      className="projects-section wrap"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-heading" data-reveal="0">
        <div>
          <span className="eyebrow">SELECTED PRODUCT WORK</span>
          <h2 id="projects-title">Projects.</h2>
        </div>
        <p>The products, the context, and where I contributed.</p>
      </div>
      <article className="product-story" aria-labelledby="athletify-title">
        <div className="product-context" data-reveal="0">
          <p className="product-kind">SPORTS & RECREATION · SAAS</p>
          <h3 id="athletify-title">Athletify</h3>
          <p className="product-summary">
            Sports and recreation management software from a team based in Utah.
          </p>
          <dl className="product-facts">
            <div>
              <dt>Role</dt>
              <dd>Full-stack Senior Developer</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>Aug–Nov 2024</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Frontend product development</dd>
            </div>
          </dl>
          <a
            className="text-link"
            href="https://www.athletify.com/"
            target="_blank"
            rel="noreferrer"
          >
            Visit Athletify <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="product-contribution" data-reveal="50">
          <span className="eyebrow">MY CONTRIBUTION</span>
          <h4>From design to product interface.</h4>
          <p>
            I translated Figma designs into frontend features with React and
            TypeScript. My work centered on the web interface, with some
            experience working in Next.js.
          </p>
          <div
            className="product-handoff"
            aria-label="Design to implementation"
          >
            <div>
              <span>Design input</span>
              <strong>Figma</strong>
            </div>
            <span className="handoff-arrow" aria-hidden="true">
              →
            </span>
            <div>
              <span>My implementation</span>
              <strong>React + TypeScript</strong>
            </div>
          </div>
          <p className="product-backend">
            <span>Product context</span>
            The wider platform used a Go backend. My contribution focused on
            frontend development.
          </p>
        </div>
      </article>
    </section>
  );
}
