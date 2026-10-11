// Roles and dates verified from the user's LinkedIn profile on 2026-10-06.
// Current Antecursor and Athletify responsibilities confirmed directly by Jhon.
// Athletify product context: https://www.linkedin.com/company/athletifyofficial
// Jhon confirmed Nimrod belongs to both Antecursor roles on 2026-10-07.
// Project contributions use the verified responsibilities for each role.
// Nimrod public product context: https://nimrod.io/
// Keep the listed overlapping roles; do not infer a relationship between employers.
export const LINKEDIN = "https://www.linkedin.com/in/jhonsmithr";
export const GITHUB = "https://github.com/JhonSmithRomeroSolorzano";
export const professionalProfile = {
  name: "Jhon Smith Romero",
  role: "Senior full-stack developer",
  location: "Pereira, Colombia",
  summary:
    "7+ years in software development, connecting JavaScript interfaces with the services and data behind them.",
  portfolio: "https://jhonsmithromerosolorzano.github.io/portfolio-lab/",
} as const;

type ExperienceProject = {
  name: string;
  description: string;
  url: string;
  contributions: readonly string[];
};

type ExperienceEntry = {
  employer: string;
  role: string;
  start: string;
  startLabel: string;
  end: string | null;
  endLabel: string;
  context: string;
  highlights?: readonly string[];
  projects?: readonly ExperienceProject[];
};

export const experience: readonly ExperienceEntry[] = [
  {
    employer: "Antecursor",
    role: "Senior Full Stack Developer",
    start: "2024-11",
    startLabel: "Nov 2024",
    end: null,
    endLabel: "Present",
    context: "Freelance · Remote · Orlando, United States",
    projects: [
      {
        name: "Nimrod",
        description: "Healthcare facility automation platform.",
        url: "https://nimrod.io/",
        contributions: [
          "Take features from design through implementation across database models, backend services, and frontend interfaces.",
          "Build features with React and Mithril.js, connected to Node.js services and NoSQL databases.",
          "Work with Azure and GitHub Actions for cloud delivery and CI/CD.",
        ],
      },
    ],
  },
  {
    employer: "Athletify",
    role: "Full-stack Senior Developer",
    start: "2024-08",
    startLabel: "Aug 2024",
    end: "2024-11",
    endLabel: "Nov 2024",
    context: "Full-time · Remote · Utah, United States",
    projects: [
      {
        name: "Athletify SaaS",
        description: "Sports and recreation management SaaS.",
        url: "https://www.athletify.com/",
        contributions: [
          "Developed frontend features for the product with React and TypeScript.",
          "Translated Figma designs into working product interfaces and gained some experience with Next.js.",
        ],
      },
    ],
  },
  {
    employer: "Antecursor",
    role: "Full-stack Developer",
    start: "2020-08",
    startLabel: "Aug 2020",
    end: "2024-07",
    endLabel: "Jul 2024",
    context: "Full-time",
    projects: [
      {
        name: "Nimrod",
        description: "Healthcare facility automation platform.",
        url: "https://nimrod.io/",
        contributions: [
          "Built responsive interfaces with React and Mithril.js, connected to Node.js services and NoSQL data.",
          "Developed product features, maintained existing workflows, and refactored code through agile iterations.",
        ],
      },
    ],
  },
  {
    employer: "Solvo Global",
    role: "Full Stack Engineer",
    start: "2020-08",
    startLabel: "Aug 2020",
    end: "2021-07",
    endLabel: "Jul 2021",
    context: "Full-time",
    highlights: [
      "Developed frontend and backend features with React, Mithril.js, Node.js, and NoSQL databases.",
    ],
  },
  {
    employer: "Business Consultants Corporation S.A.S.",
    role: "Full Stack Developer",
    start: "2018-12",
    startLabel: "Dec 2018",
    end: "2020-08",
    endLabel: "Aug 2020",
    context: "Full-time · Pasto, Colombia",
    highlights: [
      "Built web applications with HTML, CSS, JavaScript, jQuery, Node.js, and SQL.",
      "Worked on data models, application architecture, and code optimization.",
    ],
  },
] as const;

export const education = [
  {
    school: "Universidad Católica de Pereira",
    qualification: "Ingeniería de Sistemas y Telecomunicaciones",
    period: "2010–2015",
  },
  {
    school: "Fundec",
    qualification: "Técnico en Informática y Sistemas",
    period: "2007–2008",
  },
] as const;

export const certifications = [
  {
    title: "Arquitecturas Limpias para Desarrollo de Software",
    issuer: "Platzi",
    date: "Dec 2025",
  },
  {
    title: "Node.js: Autenticación, Microservicios y Redis",
    issuer: "Platzi",
    date: "Feb 2024",
  },
] as const;
