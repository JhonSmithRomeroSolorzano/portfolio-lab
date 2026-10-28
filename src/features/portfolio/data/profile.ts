// Jhon confirmed the supplied résumé's corrected roles/dates on 2026-10-28.
// That correction supersedes the LinkedIn snapshot from 2026-10-06.
// Current Antecursor and Athletify responsibilities confirmed directly by Jhon.
// Athletify product context: https://www.linkedin.com/company/athletifyofficial
// Jhon confirmed Nimrod belongs to both Antecursor roles on 2026-10-07.
// Project contributions use the verified responsibilities for each role.
// Nimrod public product context: https://nimrod.io/
// Do not infer a relationship between employers.
export const LINKEDIN = "https://www.linkedin.com/in/jhonsmithr";
export const GITHUB = "https://github.com/JhonSmithRomeroSolorzano";

// Jhon authorized these exact details in downloads and on the public site.
type VerifiedContactDetail = {
  kind: "email" | "phone" | "calendar";
  label: string;
  href: string;
};

export const verifiedContactDetails: readonly VerifiedContactDetail[] = [
  {
    kind: "email",
    label: "jhon.smith@ucp.edu.co",
    href: "mailto:jhon.smith@ucp.edu.co",
  },
  {
    kind: "phone",
    label: "+57 3202065522",
    href: "tel:+573202065522",
  },
];
export const professionalProfile = {
  name: "Jhon Smith Romero",
  role: "Senior Full-Stack Engineer · AI-assisted development",
  location: "Pereira, Colombia",
  summary:
    "9+ years across interfaces, services, and data. My recent work includes AI-assisted development and multi-agent implementation, testing, and review.",
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
  summary: string;
  resumeSummary: string;
  highlights?: readonly string[];
  projects?: readonly ExperienceProject[];
};

export const experience: readonly ExperienceEntry[] = [
  {
    employer: "Antecursor",
    role: "Full-Stack Senior Developer",
    start: "2024-11",
    startLabel: "Nov 2024",
    end: null,
    endLabel: "Present",
    context: "Freelance · Remote · Orlando, United States",
    summary:
      "Full-stack development of Nimrod, a building-management platform for monitoring, configuring, and automating connected equipment.",
    resumeSummary:
      "Develop React/Mithril.js and Node.js building automation: BACnet, dashboards, equipment/network workflows, alarms, reporting, cloud authentication, and tests. Use Codex, OpenCode, and ChatGPT; recently began coordinating agents for implementation, testing, and review, owning requirements, context, and validation.",
    // Jhon confirmed these recent responsibilities belong to his current role.
    highlights: [
      "Use Codex, OpenCode, and ChatGPT regularly for AI-assisted frontend and backend development.",
      "Recently started coordinating agents for focused implementation, testing, and review. I define requirements and context, review changes, and validate results with automated tests and checks in the application.",
    ],
    projects: [
      {
        name: "Nimrod",
        description: "Building-management automation platform.",
        url: "https://nimrod.io/",
        contributions: [
          "Take features from design through implementation across database models, backend services, and frontend interfaces.",
          "Build features with React and Mithril.js, connected to Node.js services and NoSQL databases.",
          "Work with Azure and GitHub Actions for cloud delivery and CI/CD.",
          "Develop BACnet integrations, dynamic dashboards, equipment and network workflows, alarms, reporting, cloud authentication, and automated tests.",
        ],
      },
    ],
  },
  {
    employer: "Athletify",
    role: "Full-Stack Senior Developer",
    start: "2024-08",
    startLabel: "Aug 2024",
    end: "2024-11",
    endLabel: "Nov 2024",
    context: "Full-time · Remote · Utah, United States",
    summary:
      "Full-stack development for a sports and recreation SaaS, including Remix/SSR interfaces, shared components, and Go services with relational databases.",
    resumeSummary:
      "Delivered route-driven Remix/SSR interfaces, shared components, and Go services with relational databases. Supported unit tests, code quality, and agile delivery; implemented React/TypeScript features from Figma, with some Next.js experience.",
    projects: [
      {
        name: "Athletify SaaS",
        description: "Sports and recreation management SaaS.",
        url: "https://www.athletify.com/",
        contributions: [
          "Developed frontend features for the product with React and TypeScript.",
          "Translated Figma designs into working product interfaces and gained some experience with Next.js.",
          "Built route-driven Remix interfaces with server-side rendering, shared components, and Go services backed by relational databases.",
          "Supported unit tests, code quality, and agile delivery.",
        ],
      },
    ],
  },
  {
    employer: "Antecursor",
    role: "Full-Stack Senior Developer",
    start: "2021-08",
    startLabel: "Aug 2021",
    end: "2024-07",
    endLabel: "Jul 2024",
    context: "Full-time · Remote · United States",
    summary:
      "Full-stack development and ongoing maintenance of Nimrod’s building-management automation workflows.",
    resumeSummary:
      "Built responsive React/Mithril.js interfaces and Node.js services with NoSQL databases. Delivered full-stack features, refactored code, improved performance, and supported continuous delivery for end users.",
    projects: [
      {
        name: "Nimrod",
        description: "Building-management automation platform.",
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
    role: "Full-Stack Senior Developer",
    start: "2020-08",
    startLabel: "Aug 2020",
    end: "2021-07",
    endLabel: "Jul 2021",
    context: "Full-time · Remote · United States",
    summary:
      "Full-stack web development connecting JavaScript interfaces with backend services and NoSQL data.",
    resumeSummary:
      "Developed React/Mithril.js, Node.js, and NoSQL applications. Delivered user-focused features, improved performance, and maintained code quality in an agile environment.",
    highlights: [
      "Developed frontend and backend features with React, Mithril.js, Node.js, and NoSQL databases.",
    ],
  },
  {
    employer: "Business Consultants Corporation S.A.S.",
    role: "Full-Stack Mid Developer",
    start: "2018-12",
    startLabel: "Dec 2018",
    end: "2020-07",
    endLabel: "Jul 2020",
    context: "Full-time · Pasto, Colombia",
    summary:
      "Web application development spanning user interfaces, backend logic, SQL data models, and application architecture.",
    resumeSummary:
      "Delivered HTML, CSS, JavaScript/jQuery, Node.js, and SQL applications. Implemented full-stack features, optimized data handling, and supported agile releases.",
    highlights: [
      "Built web applications with HTML, CSS, JavaScript, jQuery, Node.js, and SQL.",
      "Worked on data models, application architecture, and code optimization.",
    ],
  },
  {
    employer: "Business Consultants Corporation S.A.S.",
    role: "Full-Stack Mid Developer",
    start: "2013-11",
    startLabel: "Nov 2013",
    end: "2016-11",
    endLabel: "Nov 2016",
    context: "Pereira, Colombia",
    summary:
      "Web application development, code analysis, and data-model and architecture design around client requirements.",
    resumeSummary:
      "Built HTML, CSS, JavaScript/jQuery, Node.js, and SQL applications. Analyzed code, optimized resources, and designed data models and architectures around client requirements.",
    highlights: [
      "Built complete web applications across interfaces, backend services, and SQL data.",
      "Analyzed code, optimized resources, and designed data models and architectures around client requirements.",
    ],
  },
] as const;

export const education = [
  {
    school: "Universidad Católica de Pereira",
    qualification: "Systems and Telecommunications Engineering",
    period: "2010–2015",
  },
  {
    school: "Fundec",
    qualification: "Técnico en Informática y Sistemas",
    period: "2007–2008",
  },
] as const;

// Supplied résumé confirmed by Jhon; language proficiency is not inferred from dots.
export const spokenLanguages = ["English", "Spanish"] as const;
export const volunteering = [
  {
    role: "Missionary (Volunteering)",
    organization: "Church of Jesus Christ of Latter-day Saints",
    period: "Nov 2016 - Nov 2018",
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
