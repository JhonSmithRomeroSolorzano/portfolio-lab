import {
  certifications,
  education,
  experience,
  GITHUB,
  LINKEDIN,
  professionalProfile,
  recentPractice,
  verifiedContactDetails,
} from "./profile";
import { languages, stackLayers, testing } from "./technology-stack";

const resumeTechnologyGroups = [
  { name: "Languages", items: [...languages] },
  ...stackLayers.map((layer) => ({
    name: layer.name,
    items: layer.groups.flatMap((group) => [...group.items]),
  })),
  { name: "Testing", items: [...testing.tools, ...testing.levels] },
];

export const resumeData = {
  ...professionalProfile,
  linkedin: LINKEDIN,
  github: GITHUB,
  contactDetails: verifiedContactDetails,
  technologies: resumeTechnologyGroups,
  recentPractice,
  experience,
  education,
  certifications,
};

export const resumeDownloads = {
  pdf: "jhon-smith-romero-resume.pdf",
  text: "jhon-smith-romero-resume.txt",
} as const;
