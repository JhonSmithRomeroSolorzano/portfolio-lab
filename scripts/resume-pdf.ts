import PDFDocument from "pdfkit";
import { resumeData } from "../src/features/portfolio/data/resume-data.ts";

const ink = "#354152";
const muted = "#56616D";
const margin = 28;
const bottom = 801;
const lineGap = 1.3;
type TextBlock = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  bold: boolean;
  color: string;
  link?: string;
};
type PdfResumeData = Omit<
  typeof resumeData,
  "name" | "role" | "summary" | "technologies"
> & {
  name: string;
  role: string;
  summary: string;
  technologies: readonly { name: string; items: readonly string[] }[];
};

/** A measured, single-page editorial layout; never shrink or silently clip text. */
export async function resumePdf(data: PdfResumeData = resumeData) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: margin, left: margin, right: margin, bottom: 14 },
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `${data.name} - Resume`,
      Author: data.name,
      Subject: data.role,
    },
  });
  const width = 595.28 - margin * 2;
  const layout: TextBlock[] = [];
  const rules: number[] = [];
  const font = (size: number, bold: boolean) =>
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
  function column(x: number, width: number, top: number) {
    return {
      y: top,
      text(
        text: string,
        size = 9.5,
        bold = false,
        color = ink,
        after = 3,
        link?: string,
      ) {
        font(size, bold);
        const height = doc.heightOfString(text, { width, lineGap });
        if (this.y + height > bottom)
          throw new Error(
            `Resume exceeds one page near "${text.slice(0, 50)}" (${Math.round(this.y + height)}pt > ${bottom}pt). Shorten the curated copy before publishing.`,
          );
        layout.push({
          text,
          x,
          y: this.y,
          width,
          height,
          size,
          bold,
          color,
          ...(link ? { link } : {}),
        });
        this.y += height + after;
      },
      heading(text: string) {
        this.text(text, 13, true, ink, 10);
      },
    };
  }
  const header = column(margin, width, 26);
  header.text(data.name, 30, false, ink, 5);
  header.text(data.role, 12, false, muted, 9);
  header.text(data.summary, 10, false, ink, 13);
  const bandTop = header.y;
  rules.push(bandTop, bandTop + 48);
  const contacts = [
    ...data.contactDetails.map((detail) => ({
      label: detail.label,
      href: detail.href,
    })),
    { label: data.linkedin.replace(/^https?:\/\//, ""), href: data.linkedin },
    { label: data.github.replace(/^https?:\/\//, ""), href: data.github },
  ];
  if (contacts.length > 4)
    throw new Error(
      "Resume contact strip exceeds four entries. Review the single-page layout.",
    );
  contacts.forEach((contact, index) => {
    const top = bandTop + 9 + Math.floor(index / 2) * 19;
    const cell = column(
      margin + (index % 2) * (width / 2 + 5),
      width / 2 - 10,
      top,
    );
    cell.text(contact.label, 9, false, ink, 0, contact.href);
    if (cell.y - top > 19)
      throw new Error("Resume contact link wraps outside its strip.");
  });
  const bodyTop = bandTop + 62;
  const work = column(margin, 326, bodyTop);
  const sidebar = column(margin + 350, width - 350, bodyTop);
  work.heading("WORK EXPERIENCE");
  for (const job of data.experience) {
    work.text(job.role, 11.5, true, ink, 1);
    work.text(job.employer, 10.5, false, ink, 2);
    work.text(
      `${job.startLabel} - ${job.endLabel}  |  ${job.context}`,
      8.5,
      false,
      muted,
      4,
    );
    work.text(job.resumeSummary, 9.5, false, muted, 8);
  }
  sidebar.heading("TECHNICAL SKILLS");
  for (const group of data.technologies) {
    sidebar.text(group.name.toUpperCase(), 8, true, ink, 2);
    sidebar.text(group.items.join(" · "), 9.5, false, muted, 7);
  }
  sidebar.y += 3;
  sidebar.heading("EDUCATION");
  for (const item of data.education) {
    sidebar.text(item.qualification, 9.5, true, ink, 2);
    sidebar.text(`${item.school} · ${item.period}`, 8.5, false, muted, 7);
  }
  sidebar.heading("VOLUNTEERING");
  for (const item of data.volunteering) {
    sidebar.text(item.role, 9.5, true, ink, 2);
    sidebar.text(`${item.organization}\n${item.period}`, 8.5, false, muted, 8);
  }
  sidebar.heading("LANGUAGES");
  sidebar.text(data.spokenLanguages.join(" · "), 9.5, false, muted, 0);
  // A curated one-page résumé links to fuller contributions and certifications.
  // Footer has its own safe bottom, outside the body columns.
  font(8, false);
  const portfolio = new URL(data.portfolio);
  const footerText = `${data.location}  ·  Full profile & certifications: ${portfolio.host}${portfolio.pathname}`;
  const footerHeight = doc.heightOfString(footerText, { width, lineGap });
  if (footerHeight > 12)
    throw new Error("Resume footer exceeds its reserved line.");
  layout.push({
    text: footerText,
    x: margin,
    y: 816,
    width,
    height: footerHeight,
    size: 8,
    bold: false,
    color: muted,
    link: data.portfolio,
  });

  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.addPage();
  for (const block of layout) {
    font(block.size, block.bold);
    doc.fillColor(block.color).text(block.text, block.x, block.y, {
      width: block.width,
      lineGap,
      ...(block.link ? { link: block.link } : {}),
    });
  }
  for (const y of rules)
    doc
      .moveTo(margin, y)
      .lineTo(margin + width, y)
      .lineWidth(0.5)
      .strokeColor("#9AA1A9")
      .stroke();
  const pages = doc.bufferedPageRange().count;
  doc.end();
  const bytes = await result;
  if (pages !== 1)
    throw new Error(
      "Resume created an unexpected page. Review the layout before publishing.",
    );
  return { bytes, pages, layout };
}
