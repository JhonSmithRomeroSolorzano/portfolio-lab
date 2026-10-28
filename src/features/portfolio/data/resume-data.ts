import {
  certifications,
  education,
  experience,
  GITHUB,
  LINKEDIN,
  professionalProfile,
  verifiedContactDetails,
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

export const resumeData = {
  ...professionalProfile,
  linkedin: LINKEDIN,
  github: GITHUB,
  contactDetails: verifiedContactDetails,
  technologies: resumeTechnologyGroups,
  experience,
  education,
  certifications,
};

export const resumeDownloads = {
  pdf: "jhon-smith-romero-resume.pdf",
  text: "jhon-smith-romero-resume.txt",
} as const;
