import {
  certifications,
  education,
  experience,
  GITHUB,
  LINKEDIN,
  professionalProfile,
} from "./profile";
import { languages, stackLayers, testing } from "./technology-stack";

export const resumeTechnologyGroups = [
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
  technologies: resumeTechnologyGroups,
  experience,
  education,
  certifications,
};

export const resumeDownloads = {
  pdf: "jhon-smith-romero-resume.pdf",
  text: "jhon-smith-romero-resume.txt",
} as const;
