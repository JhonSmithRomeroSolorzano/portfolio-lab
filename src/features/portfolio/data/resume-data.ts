import {
  certifications,
  education,
  experience,
  GITHUB,
  LINKEDIN,
  professionalProfile,
  verifiedContactDetails,
  volunteering,
  spokenLanguages,
} from "./profile";
import {
  aiDevelopment,
  languages,
  stackLayers,
  testing,
} from "./technology-stack";

const resumeTechnologyGroups = [
  { name: "Languages", items: [...languages] },
  ...stackLayers.map((layer) => ({
    name: layer.name,
    items: layer.groups.flatMap((group) => [...group.items]),
  })),
  { name: "Testing", items: [...testing.tools, ...testing.levels] },
  {
    name: aiDevelopment.label,
    items: [...aiDevelopment.tools, aiDevelopment.workflow],
  },
];

// Display-only self-ratings copied from Jhon's supplied résumé reference.
// These are not measured proficiency scores; do not infer ratings for new skills.
export const resumeSkillRatings = [
  { label: "Javascript", filled: 5 },
  { label: "ReactJS", filled: 4 },
  { label: "MithrilJS", filled: 5 },
  { label: "NodeJs", filled: 5 },
  { label: "NoSQL Databases", filled: 5 },
  { label: "SQL Databases", filled: 3 },
  { label: "Git", filled: 5 },
  { label: "CSS", filled: 5 },
  { label: "HTML", filled: 5 },
  { label: "Agile", filled: 4 },
  { label: "Docker", filled: 3 },
  { label: "ProblemSolving", filled: 5 },
] as const;

export const resumeData = {
  ...professionalProfile,
  linkedin: LINKEDIN,
  github: GITHUB,
  contactDetails: verifiedContactDetails,
  technologies: resumeTechnologyGroups,
  experience,
  education,
  certifications,
  volunteering,
  spokenLanguages,
  // Prioritize current AI/framework experience while keeping reference scores
  // only for skills that actually had a supplied rating. Jhon separately
  // confirmed AI at five dots and Next.js, Remix, TypeScript, and Linux at four.
  skillRatings: [
    {
      label: "AI-assisted development",
      filled: 5,
    },
    resumeSkillRatings[0],
    { label: "TypeScript", filled: 4 },
    resumeSkillRatings[1],
    resumeSkillRatings[2],
    { label: "Next.js", filled: 4 },
    { label: "Remix", filled: 4 },
    ...resumeSkillRatings.slice(3, 7),
    resumeSkillRatings[10],
    { label: "Linux", filled: 4 },
  ],
  languageRatings: [
    { label: "English", filled: 5 },
    { label: "Spanish", filled: 5 },
  ],
  headline:
    "Senior Full Stack Software Engineer | AI-assisted development | JavaScript | TypeScript | React | Mithril.js | Next.js | Node.js | NoSQL & SQL | Git | Docker | Linux",
  introduction: professionalProfile.summary,
};

export const resumeDownloads = {
  pdf: "jhon-smith-romero-resume.pdf",
  text: "jhon-smith-romero-resume.txt",
} as const;
