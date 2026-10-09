// Experience confirmed by Jhon and his LinkedIn profile on October 6, 2026.
// Preserve his distinction between Azure experience and some AWS experience.
export const languages = ["JavaScript", "TypeScript"] as const;
export const testing = {
  tools: ["Jest", "Playwright", "Mocha"],
  levels: ["Integration", "End-to-end (E2E)"],
} as const;

export const stackLayers = [
  {
    id: "frontend",
    name: "Frontend",
    caption: "UI + styling",
    title: "Interfaces, components, and styling.",
    description:
      "Product interfaces built from design handoff through reusable components, styling, and service integration.",
    groups: [
      { label: "UI libraries", items: ["React", "Mithril.js"] },
      { label: "Framework", items: ["Next.js (some experience)"] },
      { label: "Components", items: ["Material UI"] },
      { label: "Styling", items: ["Tailwind CSS", "CSS"] },
      { label: "Design handoff", items: ["Figma"] },
    ],
    destination: "#resume",
    action: "See my project contributions",
  },
  {
    id: "backend",
    name: "Backend",
    caption: "APIs + real time",
    title: "Services behind the interface.",
    description:
      "I use JavaScript and TypeScript with the Node.js runtime and Express framework to build backend services. My work includes REST APIs and real-time communication with WebSockets.",
    groups: [
      { label: "Runtime", items: ["Node.js"] },
      { label: "Framework", items: ["Express"] },
      { label: "Communication", items: ["REST APIs", "WebSockets"] },
    ],
    destination: "#lab",
    action: "Open Signal Lab",
  },
  {
    id: "data",
    name: "Data",
    caption: "Databases + cache",
    title: "Strongest in NoSQL. Experienced in SQL.",
    description:
      "NoSQL is my strongest area of database experience, alongside work with SQL databases. I also use Redis for caching, connecting data and fast repeated reads to the services that need them.",
    groups: [
      { label: "Databases", items: ["NoSQL (strongest)", "SQL"] },
      { label: "Cache", items: ["Redis"] },
    ],
    destination: "#resume",
    action: "Read my experience",
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    caption: "Containers + delivery",
    title: "From a change to a deployment.",
    description:
      "I work with Docker and GitHub Actions for continuous integration and continuous deployment (CI/CD). My cloud experience includes Azure and some work with AWS. Testing across the stack helps me check changes before they ship.",
    groups: [
      { label: "Containers", items: ["Docker"] },
      { label: "CI/CD", items: ["GitHub Actions"] },
      { label: "Cloud", items: ["Azure", "AWS (some experience)"] },
    ],
    destination: "#resume",
    action: "See my delivery experience",
  },
] as const;
