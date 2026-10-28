import { test } from "node:test";
import assert from "node:assert/strict";
import {
  experience,
  education,
  professionalProfile,
  verifiedContactDetails,
} from "../src/features/portfolio/data/profile.ts";
import {
  resumeData,
  resumeSkillRatings,
} from "../src/features/portfolio/data/resume-data.ts";
import {
  resumeGroups,
  resumePdf,
  resumeText,
} from "../scripts/resume-document.ts";

test("resume exports preserve each period, its contributions, accents, and qualified experience", () => {
  const text = resumeText();
  for (const role of experience) {
    assert.ok(text.includes(`${role.startLabel} - ${role.endLabel}`));
    assert.ok(text.includes(role.resumeSummary));
    for (const highlight of role.highlights ?? [])
      assert.ok(text.includes(highlight));
    for (const project of role.projects ?? []) {
      for (const contribution of project.contributions)
        assert.ok(text.includes(contribution));
    }
  }
  assert.equal(text.split("Nimrod | https://nimrod.io/").length - 1, 2);
  assert.ok(text.includes(education[0].qualification));
  assert.ok(text.includes("Next.js"));
  assert.ok(!text.includes("Next.js (some experience)"));
  assert.ok(text.includes("AWS (some experience)"));
  assert.ok(text.includes("NoSQL (strongest)"));
  assert.ok(text.includes(professionalProfile.role));
  assert.ok(text.includes(professionalProfile.summary));
  assert.equal(resumeData.introduction, professionalProfile.summary);
  assert.ok(!text.includes("RECENT PRACTICE"));
  assert.ok(!/[\u2010-\u2015]/.test(text));
});

test("PDF generation is valid, bounded, and rejects sections that would be clipped", async () => {
  const pdf = await resumePdf();
  assert.equal(pdf.bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.bytes.subarray(-20).toString().includes("%%EOF"));
  assert.equal(pdf.pages, 1);
  // Count the PDF's actual page objects, including any added implicitly by text overflow.
  assert.equal(
    (pdf.bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length,
    pdf.pages,
  );
  assert.ok(pdf.bytes.length < 100_000);
  await assert.rejects(
    resumePdf({
      ...resumeData,
      introduction: "A long introduction. ".repeat(1500),
    }),
    /exceeds one page/,
  );
  await assert.rejects(
    resumePdf({
      ...resumeData,
      experience: [
        {
          ...experience[0],
          resumeSummary: "A long responsibility. ".repeat(1500),
        },
      ],
    }),
    /exceeds one page/,
  );
  await assert.rejects(
    resumePdf({
      ...resumeData,
      skillRatings: [{ label: "A long skill list. ".repeat(1500), filled: 5 }],
    }),
    /exceeds one page/,
  );
  await assert.rejects(
    resumePdf({
      ...resumeData,
      contactDetails: [
        {
          kind: "email",
          label: "Too long to fit. ".repeat(20),
          href: "mailto:jhon.smith@ucp.edu.co",
        },
        verifiedContactDetails[1],
      ],
    }),
    /contact link wraps/,
  );
});

test("exports use Jhon's corrected career periods without moving recent AI into earlier roles", () => {
  const groups = resumeGroups();
  const text = resumeText(groups);
  const jobHeadings = groups
    .flat()
    .filter((line) => line.bold && line.text.includes(" | ") && !line.link);
  assert.equal(jobHeadings.length, experience.length);
  const currentRole = groups.find((group) =>
    group.some((line) => line.text.includes("Nov 2024 - Present")),
  );
  const athletify = groups.find((group) =>
    group.some((line) => line.text.includes("Athletify")),
  );
  assert.ok(
    athletify?.some(
      (line) => line.text.includes("Next.js") && line.text.includes("Remix"),
    ),
  );
  assert.ok(
    currentRole?.some((line) =>
      line.text.includes("Codex, OpenCode, and ChatGPT"),
    ),
  );
  assert.ok(
    currentRole?.some((line) =>
      line.text.includes("automated tests and checks in the application"),
    ),
  );
  for (const group of groups.filter((group) =>
    group.some((line) => line.text.includes("Aug 2021 - Jul 2024")),
  ))
    assert.ok(
      !group.some((line) => /Codex|coordinating agents/.test(line.text)),
    );
  assert.ok(
    text.indexOf("Nov 2024 - Present") < text.indexOf("Aug 2024 - Nov 2024"),
  );
  assert.ok(
    text.indexOf("Aug 2024 - Nov 2024") < text.indexOf("Aug 2021 - Jul 2024"),
  );
  assert.ok(text.includes("Dec 2018 - Jul 2020"));
  assert.ok(text.includes("Nov 2013 - Nov 2016"));
  assert.ok(!text.includes("Aug 2020 - Jul 2024"));
  assert.ok(text.includes("Remix"));
  assert.ok(!text.includes("Remix/SSR"));
  assert.ok(text.includes("services with relational databases"));
  assert.ok(!text.includes("Go services"));
  assert.ok(text.includes("Linux"));
  assert.ok(text.includes("9+ years"));
  assert.ok(text.includes("Missionary (Volunteering)"));
  assert.ok(text.includes("English · Spanish"));
  for (const detail of verifiedContactDetails)
    assert.ok(text.includes(detail.href));
});

test("single-page PDF lays out all six roles and selectable linked contact text without collisions", async () => {
  const { layout, bytes, circles, pageWidth, pageHeight } = await resumePdf();
  const verticalScale = pageHeight / 841.89;
  assert.ok(Math.abs(pageWidth / pageHeight - 1323 / 1783) < 0.00001);
  const text = layout.map((block) => block.text).join("\n");
  for (const job of experience) {
    assert.ok(text.includes(job.resumeSummary));
    const numericDate = `${job.start.slice(5, 7)}/${job.start.slice(0, 4)}`;
    assert.ok(text.includes(numericDate));
    assert.equal(
      layout.find((block) => block.text === job.resumeSummary)?.size,
      7.6,
    );
    assert.equal(
      layout.find((block) => block.text === job.resumeSummary)?.font,
      "Italic",
    );
  }
  assert.equal(experience.length, 6);
  for (const block of layout) {
    assert.ok(block.x >= 25 && block.x + block.width <= 588);
    assert.ok(
      block.y >= 7 * verticalScale &&
        block.y + block.height <= 838 * verticalScale,
    );
    assert.ok(block.size >= 7.5);
  }
  for (const [index, block] of layout.entries())
    for (const other of layout.slice(index + 1)) {
      const horizontal =
        block.x < other.x + other.width && other.x < block.x + block.width;
      const vertical =
        block.y < other.y + other.height - 0.01 &&
        other.y < block.y + block.height - 0.01;
      assert.ok(
        !(horizontal && vertical),
        `Overlapping PDF text: ${block.text} / ${other.text}`,
      );
    }
  for (const href of [
    resumeData.linkedin,
    resumeData.github,
    resumeData.portfolio,
    ...verifiedContactDetails.map((detail) => detail.href),
  ]) {
    assert.ok(layout.some((block) => block.link === href));
    assert.ok(bytes.toString("latin1").includes(`/URI (${href})`));
  }
  assert.ok(text.includes("AI-assisted development"));
  assert.ok(layout.some((block) => block.text === professionalProfile.summary));
  assert.ok(text.includes("Next.js"));
  assert.ok(text.includes("Remix"));
  assert.ok(!text.includes("SSR"));
  assert.ok(layout.some((block) => block.text === "TypeScript"));
  assert.ok(
    !layout.some((block) => block.text === "Codex · OpenCode · ChatGPT"),
  );
  assert.ok(!layout.some((block) => block.text === "Multi-agent workflows"));
  assert.ok(!text.includes("(some experience)"));
  assert.equal(circles.length, 75);
  assert.equal(circles.filter((circle) => !circle.filled).length, 9);
  for (const label of ["Next.js", "TypeScript", "Remix"]) {
    const block = layout.find((item) => item.text === label)!;
    assert.ok(block);
    assert.deepEqual(
      circles
        .filter((circle) => circle.y === block.y + 6)
        .map((circle) => circle.filled),
      [true, true, true, true, false],
      `${label} uses Jhon's confirmed four-dot rating`,
    );
  }
  const aiRow = layout.find(
    (block) => block.text === "AI-assisted development",
  )!;
  assert.deepEqual(
    circles
      .filter((circle) => circle.y === aiRow.y + 6)
      .map((circle) => circle.filled),
    [true, true, true, true, true],
  );
  const linuxRow = layout.find((block) => block.text === "Linux")!;
  assert.ok(linuxRow);
  assert.deepEqual(
    circles
      .filter((circle) => circle.y === linuxRow.y + 6)
      .map((circle) => circle.filled),
    [true, true, true, true, false],
  );
  assert.ok(!/\b(Go|Python|Remix)\b/.test(resumeData.headline));
  const contactRows = layout.filter(
    (block) =>
      block.link &&
      block.y > 156 * verticalScale &&
      block.y < 193 * verticalScale,
  );
  assert.equal(contactRows.length, 4);
  for (const block of contactRows) {
    assert.ok(
      Math.abs(block.y + block.height / 2 - 174.5 * verticalScale) < 0.01,
    );
  }
  assert.equal(
    layout.find((block) => block.text === "TECHNICAL SKILLS")?.x,
    333,
  );
  assert.equal(
    layout.find((block) => block.text === "WORK EXPERIENCE")?.y,
    204 * verticalScale,
  );
  assert.equal(
    layout.find((block) => block.text === "VOLUNTEER EXPERIENCE")?.y,
    681 * verticalScale,
  );
  assert.ok(bytes.toString("latin1").includes("Lato"));
});

test("PDF self-rating values remain the supplied reference values, not inferred scores", async () => {
  assert.deepEqual(
    resumeSkillRatings.map((row) => [row.label, row.filled]),
    [
      ["Javascript", 5],
      ["ReactJS", 4],
      ["MithrilJS", 5],
      ["NodeJs", 5],
      ["NoSQL Databases", 5],
      ["SQL Databases", 3],
      ["Git", 5],
      ["CSS", 5],
      ["HTML", 5],
      ["Agile", 4],
      ["Docker", 3],
      ["ProblemSolving", 5],
    ],
  );
  assert.deepEqual(resumeData.languageRatings, [
    { label: "English", filled: 5 },
    { label: "Spanish", filled: 5 },
  ]);
  assert.deepEqual(
    resumeData.skillRatings.map((row) => [row.label, row.filled]),
    [
      ["AI-assisted development", 5],
      ["Javascript", 5],
      ["TypeScript", 4],
      ["ReactJS", 4],
      ["MithrilJS", 5],
      ["Next.js", 4],
      ["Remix", 4],
      ["NodeJs", 5],
      ["NoSQL Databases", 5],
      ["SQL Databases", 3],
      ["Git", 5],
      ["Docker", 3],
      ["Linux", 4],
    ],
  );
  await assert.rejects(
    resumePdf({
      ...resumeData,
      skillRatings: [{ label: "Invalid", filled: 6 }],
    }),
    /supplied value/,
  );
  await assert.rejects(
    resumePdf({
      ...resumeData,
      skillRatings: Array.from({ length: 14 }, () => ({
        label: "Too many",
        filled: 5,
      })),
    }),
    /thirteen rows/,
  );
});
