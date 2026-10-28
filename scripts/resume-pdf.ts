import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { resumeData } from "../src/features/portfolio/data/resume-data.ts";

// Geometry and type hierarchy follow the owner's supplied visual reference.
const pageWidth = 595.28;
// Match the supplied page's 1323 × 1783 proportions, not the taller A4 draft.
const pageHeight = (pageWidth * 1783) / 1323;
const verticalScale = pageHeight / 841.89;
const ink = "#354152";
const bodyInk = "#171717";
const muted = "#757575";
const left = 25;
const workWidth = 280;
const sidebarX = 333;
const sidebarWidth = pageWidth - sidebarX - 25;
const lineGap = 0;
type Font = "Regular" | "Italic" | "Bold";
type TextBlock = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  font: Font;
  color: string;
  link?: string;
  align?: "left" | "right" | "center";
};
type Rating = { label: string; filled: number | null; detail?: string };
type PdfResumeData = Omit<
  typeof resumeData,
  "introduction" | "headline" | "skillRatings" | "languageRatings"
> & {
  headline: string;
  introduction: string;
  skillRatings: readonly Rating[];
  languageRatings: readonly Rating[];
};
const numericPeriod = (value: string) =>
  `${value.slice(5, 7)}/${value.slice(0, 4)}`;

/** One selectable-text page, matching the reference rather than a new template. */
export async function resumePdf(data: PdfResumeData = resumeData) {
  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: `${data.name} - Resume`,
      Author: data.name,
      Subject: data.role,
    },
  });
  for (const face of ["Regular", "Italic", "Bold"] as const)
    doc.registerFont(
      face,
      fileURLToPath(
        new URL(`./assets/resume-fonts/Lato-${face}.ttf`, import.meta.url),
      ),
    );
  const layout: TextBlock[] = [];
  const circles: { x: number; y: number; filled: boolean }[] = [];
  const icons: { x: number; y: number; label: string }[] = [];
  function text(
    value: string,
    x: number,
    y: number,
    width: number,
    size: number,
    font: Font = "Regular",
    color = bodyInk,
    limit = 838,
    link?: string,
    align?: TextBlock["align"],
  ) {
    doc.font(font).fontSize(size);
    const height = doc.heightOfString(value, { width, lineGap });
    const top = y * verticalScale;
    if (top + height > limit * verticalScale)
      throw new Error(
        `Resume exceeds one page or its reserved region near "${value.slice(0, 50)}". Review the reference layout before publishing.`,
      );
    layout.push({
      text: value,
      x,
      y: top,
      width,
      height,
      size,
      font,
      color,
      ...(link ? { link } : {}),
      ...(align ? { align } : {}),
    });
    // Positions use the reference grid; font sizes are never stretched/scaled.
    return height / verticalScale;
  }
  function heading(value: string, x: number, y: number, width: number) {
    return text(value, x, y, width, 15.2, "Bold", ink);
  }
  text(
    data.name,
    left,
    7,
    pageWidth - left * 2,
    24,
    "Regular",
    ink,
    40,
    data.portfolio,
  );
  text(
    data.headline,
    left,
    40,
    pageWidth - left * 2,
    10.7,
    "Regular",
    muted,
    73,
  );
  text(
    data.introduction,
    left,
    78,
    pageWidth - left * 2,
    8.3,
    "Regular",
    bodyInk,
    145,
  );

  // One row, with the same small dark square contact marks as the reference.
  const contacts = [
    ...data.contactDetails.map((detail) => ({
      label: detail.label,
      href: detail.href,
      icon: detail.kind === "email" ? "@" : "P",
    })),
    {
      label: data.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: data.linkedin,
      icon: "in",
    },
    {
      label: data.github.replace(/^https?:\/\//, ""),
      href: data.github,
      icon: "gh",
    },
  ];
  if (contacts.length !== 4)
    throw new Error(
      "Resume contact strip requires the four confirmed reference entries.",
    );
  const contactX = [28, 154, 251, 405];
  const contactEnds = [148, 245, 399, 588];
  const contactCenter = (156 + 193) / 2;
  contacts.forEach((contact, index) => {
    doc.font("Regular").fontSize(8.4);
    if (
      doc.widthOfString(contact.label) >
      contactEnds[index] - contactX[index] - 17
    )
      throw new Error(
        "Resume contact link wraps outside its single-row strip.",
      );
    const contactWidth = contactEnds[index] - contactX[index] - 17;
    const contactHeight = doc.heightOfString(contact.label, {
      width: contactWidth,
      lineGap,
    });
    icons.push({
      x: contactX[index],
      y: contactCenter - 11 / (2 * verticalScale),
      label: contact.icon,
    });
    const height = text(
      contact.label,
      contactX[index] + 17,
      contactCenter - contactHeight / (2 * verticalScale),
      contactWidth,
      8.4,
      "Regular",
      bodyInk,
      187,
      contact.href,
    );
    if (height > 12 / verticalScale)
      throw new Error(
        "Resume contact link wraps outside its single-row strip.",
      );
  });

  heading("WORK EXPERIENCE", left, 204, workWidth);
  let y = 232;
  for (const job of data.experience) {
    y += text(job.role, left, y, workWidth, 11.8, "Bold") + 1;
    y += text(job.employer, left, y, workWidth, 11.2) + 3;
    const period = `${numericPeriod(job.start)} - ${job.end ? numericPeriod(job.end) : job.endLabel}`;
    const location = job.resumeLocation;
    const dateHeight = text(period, left, y, 140, 7.5, "Italic", muted);
    if (location)
      text(
        location,
        left + 150,
        y,
        workWidth - 150,
        7.5,
        "Italic",
        muted,
        838,
        undefined,
        "right",
      );
    y += dateHeight + 2;
    y += text(job.resumeSummary, left, y, workWidth, 7.6, "Italic", muted) + 8;
  }
  heading("TECHNICAL SKILLS", sidebarX, 204, sidebarWidth);
  if (data.skillRatings.length > 13)
    throw new Error("Resume skill ratings exceed the reserved thirteen rows.");
  function rating(row: Rating, top: number, dotStart: number, step: number) {
    if (row.filled === null) {
      text(
        row.label,
        sidebarX,
        top,
        sidebarWidth,
        9,
        row.detail ? "Bold" : "Regular",
        bodyInk,
        top + 13,
      );
      if (row.detail)
        text(
          row.detail,
          sidebarX,
          top + 12,
          sidebarWidth,
          7.8,
          "Regular",
          muted,
          top + 26,
        );
      return;
    }
    if (!Number.isInteger(row.filled) || row.filled < 0 || row.filled > 5)
      throw new Error(
        "Resume ratings must copy a supplied value between zero and five.",
      );
    text(
      row.label,
      sidebarX,
      top,
      dotStart - sidebarX - 12,
      9,
      "Regular",
      bodyInk,
      top + 13,
    );
    for (let index = 0; index < 5; index++)
      circles.push({
        x: dotStart + step * index,
        y: top * verticalScale + 6,
        filled: index < row.filled,
      });
  }
  const skillRowStep = data.skillRatings.length > 12 ? 26 : 28.3;
  data.skillRatings.forEach((row, index) =>
    rating(row, 236 + index * skillRowStep, 476, 21.7),
  );

  heading("EDUCATION", sidebarX, 576, sidebarWidth);
  // The reference presents the degree; secondary study/certifications stay in
  // the complete website/text export, not squeezed into this fixed template.
  const degree = data.education[0];
  if (degree) {
    const degreeHeight = text(
      degree.qualification.replace(/ Engineering$/, "\nEngineering"),
      sidebarX,
      602,
      sidebarWidth,
      11.1,
      "Bold",
      bodyInk,
      636,
    );
    const schoolY = 602 + degreeHeight + 2;
    const schoolHeight = text(
      degree.school,
      sidebarX,
      schoolY,
      sidebarWidth,
      10.7,
      "Regular",
      bodyInk,
      654,
    );
    const datesY = schoolY + schoolHeight + 4;
    text(degree.resumePeriod, sidebarX, datesY, 160, 7.5, "Italic", muted, 667);
    text(
      degree.resumeLocation,
      sidebarX + 165,
      datesY,
      sidebarWidth - 165,
      7.5,
      "Italic",
      muted,
      667,
      undefined,
      "right",
    );
  }
  heading("VOLUNTEER EXPERIENCE", sidebarX, 681, sidebarWidth);
  if (data.volunteering.length > 1)
    throw new Error(
      "Resume volunteering exceeds the reference's reserved section.",
    );
  for (const item of data.volunteering) {
    text(item.role, sidebarX, 707, sidebarWidth, 11.1, "Bold", bodyInk, 725);
    const organizationHeight = text(
      item.organization,
      sidebarX,
      722,
      sidebarWidth,
      10.5,
      "Regular",
      bodyInk,
      749,
    );
    text(
      `${numericPeriod(item.start)} - ${numericPeriod(item.end)}`,
      sidebarX,
      722 + organizationHeight + 4,
      sidebarWidth,
      7.5,
      "Italic",
      muted,
      764,
    );
  }
  heading("LANGUAGES", sidebarX, 771, sidebarWidth);
  if (data.languageRatings.length > 2)
    throw new Error("Resume languages exceed the reference's two rows.");
  data.languageRatings.forEach((row, index) =>
    rating(row, 800 + index * 23, 430, 19),
  );

  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.addPage();
  for (const block of layout)
    doc
      .font(block.font)
      .fontSize(block.size)
      .fillColor(block.color)
      .text(block.text, block.x, block.y, {
        width: block.width,
        lineGap,
        ...(block.link ? { link: block.link } : {}),
        ...(block.align ? { align: block.align } : {}),
      });
  for (const ruleY of [156, 193])
    doc
      .moveTo(0, ruleY * verticalScale)
      .lineTo(pageWidth, ruleY * verticalScale)
      .lineWidth(0.5)
      .strokeColor("#626262")
      .stroke();
  for (const icon of icons) {
    doc.roundedRect(icon.x, icon.y * verticalScale, 11, 11, 1.2).fill(ink);
    doc
      .font("Bold")
      .fontSize(6)
      .fillColor("#FFFFFF")
      .text(icon.label, icon.x, icon.y * verticalScale + 1.5, {
        width: 11,
        align: "center",
        lineBreak: false,
      });
  }
  for (const circle of circles) {
    doc.circle(circle.x, circle.y, 4.8).lineWidth(1).strokeColor(ink);
    if (circle.filled) doc.fill(ink);
    else doc.stroke();
  }
  const pages = doc.bufferedPageRange().count;
  doc.end();
  const bytes = await result;
  if (pages !== 1)
    throw new Error(
      "Resume created an unexpected page. Review the reference layout before publishing.",
    );
  return { bytes, pages, layout, circles, pageWidth, pageHeight };
}
