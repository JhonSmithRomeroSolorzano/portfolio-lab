import { resumeData } from "../src/features/portfolio/data/resume-data.ts";
export { resumePdf } from "./resume-pdf.ts";

type ResumeLine = {
  text: string;
  size?: number;
  bold?: boolean;
  color?: string;
  after?: number;
  indent?: number;
  link?: string;
};
export type ResumeGroup = readonly ResumeLine[];
const blue = "#245C96";
const muted = "#475569";
const normalize = (text: string) => text.replace(/[\u2010-\u2015]/g, "-");
const heading = (text: string): ResumeLine => ({
  text,
  bold: true,
  size: 11,
  color: blue,
  after: 10,
});

/** Keep every responsibility with its employer and the correct project period. */
export function resumeGroups(data = resumeData): ResumeGroup[] {
  const groups: ResumeGroup[] = [
    [
      { text: data.name, size: 25, bold: true, after: 5 },
      { text: data.role, size: 13, color: blue, after: 6 },
      { text: data.location, color: muted, after: 8 },
      { text: data.summary, after: 9 },
      ...[
        data.linkedin,
        data.github,
        data.portfolio,
        ...data.contactDetails.map((detail) => detail.href),
      ].map((link) => ({
        text: link,
        link,
        size: 9,
        color: blue,
        after: 3,
      })),
    ],
    [
      heading("TECHNOLOGIES"),
      ...data.technologies.map((group) => ({
        text: `${group.name}: ${group.items.join(" · ")}`,
        size: 9.5,
        after: 5,
      })),
    ],
  ];
  for (const [index, job] of data.experience.entries()) {
    groups.push([
      ...(index === 0 ? [heading("EXPERIENCE")] : []),
      { text: `${job.role} | ${job.employer}`, bold: true, size: 11, after: 3 },
      {
        text: `${job.startLabel} - ${job.endLabel} | ${job.context}`,
        size: 9,
        color: muted,
        after: 7,
      },
      { text: job.resumeSummary, after: 7 },
      ...(job.highlights ?? []).map((text) => ({
        text: `- ${text}`,
        indent: 8,
        after: 5,
      })),
      ...(job.projects ?? []).flatMap((project) => [
        {
          text: `${project.name} | ${project.url}`,
          link: project.url,
          bold: true,
          size: 10,
          color: blue,
          after: 3,
        },
        { text: project.description, size: 9, color: muted, after: 7 },
        ...project.contributions.map((text) => ({
          text: `- ${text}`,
          indent: 8,
          after: 5,
        })),
      ]),
    ]);
  }
  groups.push(
    [
      heading("EDUCATION"),
      ...data.education.flatMap((item) => [
        { text: item.qualification, bold: true, after: 3 },
        {
          text: `${item.school} | ${item.period}`,
          size: 9,
          color: muted,
          after: 9,
        },
      ]),
    ],
    [
      heading("SELECTED CERTIFICATIONS"),
      ...data.certifications.flatMap((item) => [
        { text: item.title, bold: true, after: 3 },
        {
          text: `${item.issuer} | ${item.date}`,
          size: 9,
          color: muted,
          after: 9,
        },
      ]),
    ],
    [
      heading("VOLUNTEER EXPERIENCE"),
      ...data.volunteering.flatMap((item) => [
        { text: item.role, bold: true, after: 3 },
        { text: `${item.organization} | ${item.period}`, after: 7 },
      ]),
    ],
    [heading("SPOKEN LANGUAGES"), { text: data.spokenLanguages.join(" · ") }],
  );
  return groups;
}

/** A selectable-text alternative for application forms and plain-text readers. */
export function resumeText(groups: readonly ResumeGroup[] = resumeGroups()) {
  return (
    groups
      .map((group) => group.map((line) => normalize(line.text)).join("\n"))
      .join("\n\n") + "\n"
  );
}
