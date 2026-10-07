import PDFDocument from "pdfkit";
import { resumeData } from "../src/resume-data.ts";

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
const ink = "#17283D";
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
      ...[data.linkedin, data.github, data.portfolio].map((link) => ({
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

export async function resumePdf(
  groups: readonly ResumeGroup[] = resumeGroups(),
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `${resumeData.name} - Resume`,
      Author: resumeData.name,
      Subject: resumeData.role,
    },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const left = 48;
  const width = 595.28 - 2 * left;
  const top = 66;
  // Reserve space for a footer inside PDFKit's normal printable area.
  const bottom = 766;
  let y = top;
  let pages = 0;
  const setFont = (line: ResumeLine) =>
    doc
      .font(line.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(line.size ?? 10);
  const options = (line: ResumeLine) => ({
    width: width - (line.indent ?? 0),
    lineGap: 2.5,
  });
  const heights = groups.map((group) =>
    group.map((line) => {
      setFont(line);
      return (
        doc.heightOfString(normalize(line.text), options(line)) +
        (line.after ?? 4)
      );
    }),
  );
  // Fail the build visibly if future content needs a different layout; never clip it.
  if (
    heights.some(
      (group) => group.reduce((sum, height) => sum + height, 0) > bottom - top,
    )
  ) {
    throw new Error(
      "A resume section exceeds one page. Split it into smaller coherent sections before publishing.",
    );
  }
  function addPage() {
    doc.addPage();
    pages++;
    y = pages === 1 ? 48 : top;
    if (pages > 1) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(`${resumeData.name} | Resume`, left, 36, {
          width,
          lineBreak: false,
        });
      doc
        .moveTo(left, 54)
        .lineTo(left + width, 54)
        .lineWidth(0.5)
        .strokeColor("#CBD5E1")
        .stroke();
    }
  }
  addPage();
  groups.forEach((group, groupIndex) => {
    const height = heights[groupIndex].reduce((sum, value) => sum + value, 0);
    if (y + height > bottom) addPage();
    group.forEach((line, lineIndex) => {
      setFont(line);
      doc
        .fillColor(line.color ?? ink)
        .text(normalize(line.text), left + (line.indent ?? 0), y, {
          ...options(line),
          ...(line.link ? { link: line.link, underline: true } : {}),
        });
      y += heights[groupIndex][lineIndex];
    });
    y += 13;
  });
  for (let index = 0; index < pages; index++) {
    doc.switchToPage(index);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text(`${index + 1} / ${pages}`, left, 780, {
        width,
        align: "right",
        lineBreak: false,
      });
  }
  if (doc.bufferedPageRange().count !== pages) {
    throw new Error(
      "Resume content created an unexpected page. Review the layout before publishing.",
    );
  }
  doc.end();
  return { bytes: await result, pages };
}
