// Jhon confirmed the supplied résumé's corrected roles/dates on 2026-10-28.
// That correction supersedes the LinkedIn snapshot from 2026-10-06.
// Jhon confirmed Mid roles at Solvo/earlier Antecursor and Senior from Athletify.
// Jhon also confirmed Jaivana (Play + Node.js) and Oceanic (Visual Basic + C#).
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
  role: "Senior Full-Stack Engineer · AI Agent Workflows",
  location: "Pereira, Colombia",
  summary:
    "Systems and Telecommunications Engineer with 9+ years of full-stack development experience. I build and maintain web applications with JavaScript, TypeScript, React, Next.js, Remix, and Node.js, connecting intuitive interfaces with reliable backend services. I coordinate AI coding agents across implementation, testing, and code review, while retaining ownership of requirements, technical decisions, and validation. I work closely with teams and clients to translate complex requirements into maintainable software.",
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
  resumeLocation?: string;
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
      "I develop Nimrod with React/Mithril.js, Node.js, Linux, and BACnet integrations. I use Codex, OpenCode, and ChatGPT and coordinate agents for implementation, testing, and review, owning requirements and validation.",
    // Jhon confirmed these recent responsibilities belong to his current role.
    highlights: [
      "Use Codex, OpenCode, and ChatGPT regularly in AI agent workflows for frontend and backend development.",
      "Coordinate agents for focused implementation, testing, and review. I define requirements and context, review changes, and validate results with automated tests and checks in the application.",
    ],
    projects: [
      {
        name: "Nimrod",
        description: "Building-management automation platform.",
        url: "https://nimrod.io/",
        contributions: [
          "Take features from design through implementation across database models, backend services, and frontend interfaces.",
          "Build features with React and Mithril.js, connected to Node.js services and NoSQL databases.",
          "Work with Linux, Azure, and GitHub Actions for cloud delivery and CI/CD.",
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
    resumeLocation: "Remote (USA)",
    summary:
      "Full-stack development for a sports and recreation SaaS, including React, Next.js, and Remix interfaces, shared components, and services with relational databases.",
    resumeSummary:
      "I built React, Next.js, and Remix interfaces and services with relational databases for a sports-management SaaS, supporting unit tests and agile delivery.",
    projects: [
      {
        name: "Athletify SaaS",
        description: "Sports and recreation management SaaS.",
        url: "https://www.athletify.com/",
        contributions: [
          "Developed frontend features for the product with React and TypeScript.",
          "Translated Figma designs into working React, TypeScript, and Next.js product interfaces.",
          "Built route-driven Remix interfaces with server-side rendering, shared components, and services backed by relational databases.",
          "Supported unit tests, code quality, and agile delivery.",
        ],
      },
    ],
  },
  {
    employer: "Antecursor",
    role: "Full-Stack Mid Developer",
    start: "2021-08",
    startLabel: "Aug 2021",
    end: "2024-07",
    endLabel: "Jul 2024",
    context: "Full-time · Remote · United States",
    resumeLocation: "Remote (USA)",
    summary:
      "Full-stack development and ongoing maintenance of Nimrod’s building-management automation workflows.",
    resumeSummary:
      "I built and maintained Nimrod features with React, Mithril.js, Node.js, and NoSQL, including interfaces, services, and refactoring.",
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
    role: "Full-Stack Mid Developer",
    start: "2020-08",
    startLabel: "Aug 2020",
    end: "2021-07",
    endLabel: "Jul 2021",
    context: "Full-time · Remote · United States",
    resumeLocation: "Remote (USA)",
    summary:
      "Full-stack web development connecting JavaScript interfaces with backend services and NoSQL data.",
    resumeSummary:
      "I developed and maintained full-stack applications with React, Mithril.js, Node.js, and NoSQL through agile iterations.",
    highlights: [
      "Developed frontend and backend features with React, Mithril.js, Node.js, and NoSQL databases.",
      "Maintained and refactored application code and collaborated in agile iterations to deliver user-focused functionality and maintain code quality.",
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
    resumeLocation: "Pasto, Nariño",
    summary:
      "Web application development spanning user interfaces, backend logic, SQL data models, and application architecture.",
    resumeSummary:
      "I built HTML/CSS, JavaScript/jQuery, Node.js, and SQL applications, working on features, data models, and architecture.",
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
    resumeLocation: "Pereira",
    summary:
      "Web application development, code analysis, and data-model and architecture design around client requirements.",
    resumeSummary:
      "I built HTML/CSS, JavaScript/jQuery, Node.js, and SQL applications and analyzed code, data models, and architecture.",
    highlights: [
      "Built complete web applications across interfaces, backend services, and SQL data.",
      "Analyzed code, optimized resources, and designed data models and architectures around client requirements.",
      "Contributed to a customer-loyalty application, including requirements gathering, final testing with the client, and collecting user feedback.",
    ],
  },
  {
    employer: "Jaivana",
    role: "Software Developer",
    start: "2013-03",
    startLabel: "Mar 2013",
    end: "2013-08",
    endLabel: "Aug 2013",
    context: "Pereira, Colombia",
    resumeLocation: "Pereira",
    summary:
      "Junior development work connecting web interfaces with backend functionality and databases.",
    resumeSummary:
      "I contributed to web applications with HTML, CSS, jQuery, Play Framework, and Node.js as a junior team member.",
    highlights: [
      "Built frontend functionality with HTML, CSS, and jQuery.",
      "Worked with Play Framework and Node.js and supported data exchange between application interfaces and databases as a junior team member.",
    ],
  },
  {
    employer: "Oceanic S.A.",
    role: "Software Developer",
    start: "2011-06",
    startLabel: "Jun 2011",
    end: "2012-06",
    endLabel: "Jun 2012",
    context: "Pereira, Colombia",
    resumeLocation: "Pereira",
    summary:
      "Junior software development using Visual Basic and C# in the .NET ecosystem.",
    resumeSummary:
      "I contributed to application development with Visual Basic and C# in the .NET ecosystem as a junior team member.",
    highlights: [
      "Contributed to application development using Visual Basic and C# in the .NET ecosystem as a junior member of the development team.",
    ],
  },
] as const;

export const education = [
  {
    school: "Universidad Católica de Pereira",
    qualification: "Systems and Telecommunications Engineering",
    period: "2010–2015",
    resumePeriod: "01/2010 - 12/2015",
    resumeLocation: "Pereira",
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
    start: "2016-11",
    end: "2018-11",
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
