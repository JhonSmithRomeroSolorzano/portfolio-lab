// Experience confirmed by Jhon and his LinkedIn profile on October 6, 2026.
// Linux and PM2 confirmed directly by Jhon on October 17, 2026.
// Preserve his distinction between Azure experience and some AWS experience.
// Jhon confirmed Next.js and Remix experience without a Next.js qualifier.
export const languages = ["JavaScript", "TypeScript"] as const;
// Jhon clarified Python is used for scripting and removed the earlier Go claim.
export const additionalLanguages = ["Python (scripting)"] as const;
export const testing = {
  tools: ["Jest", "Playwright", "Mocha"],
  levels: ["Integration", "End-to-end (E2E)"],
} as const;

// AI-assisted frontend/backend practice confirmed directly by Jhon.
export const aiDevelopment = {
  label: "AI-assisted development",
  tools: ["Codex", "OpenCode", "ChatGPT"],
  workflow: "Multi-agent workflows",
} as const;

export const stackLayers = [
  {
    id: "frontend",
    name: "Frontend",
    caption: "UI + styling",
    aiAssisted: true,
    title: "Interfaces, components, and styling.",
    description:
      "From Figma designs to reusable interfaces, styling, and service integration.",
    groups: [
      { label: "UI libraries", items: ["React", "Mithril.js", "Material UI"] },
      {
        label: "Frameworks",
        items: ["Remix", "Next.js"],
      },
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
    aiAssisted: true,
    title: "Services behind the interface.",
    description:
      "JavaScript and TypeScript services with Node.js and Express, connecting REST APIs and real-time WebSockets.",
    groups: [
      { label: "Runtime", items: ["Node.js"] },
      { label: "Framework", items: ["Express"] },
      { label: "Additional languages", items: [...additionalLanguages] },
      { label: "Communication", items: ["REST APIs", "WebSockets"] },
    ],
    destination: "#lab",
    action: "Explore Labs & play",
  },
  {
    id: "data",
    name: "Data",
    caption: "Databases + cache",
    aiAssisted: false,
    title: "Strongest in NoSQL. Experienced in SQL.",
    description:
      "NoSQL is my strongest database experience, alongside SQL and Redis caching for fast repeated reads.",
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
    aiAssisted: false,
    title: "From a change to a deployment.",
    description:
      "Linux, PM2, Docker, and GitHub Actions for delivery, with Azure cloud experience and some AWS.",
    groups: [
      { label: "Operating systems", items: ["Linux"] },
      { label: "Process management", items: ["PM2"] },
      { label: "Containers", items: ["Docker"] },
      { label: "Version control", items: ["Git"] },
      { label: "CI/CD", items: ["GitHub Actions"] },
      { label: "Cloud", items: ["Azure", "AWS (some experience)"] },
    ],
    destination: "#resume",
    action: "See my delivery experience",
  },
] as const;
