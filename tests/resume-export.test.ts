import { test } from "node:test";
import assert from "node:assert/strict";
import { experience, education } from "../src/profile.ts";
import {
  resumeGroups,
  resumePdf,
  resumeText,
} from "../scripts/resume-document.ts";

test("resume exports preserve each period, its contributions, accents, and qualified experience", () => {
  const text = resumeText();
  for (const role of experience) {
    assert.ok(text.includes(`${role.startLabel} - ${role.endLabel}`));
    for (const highlight of role.highlights ?? [])
      assert.ok(text.includes(highlight));
    for (const project of role.projects ?? []) {
      for (const contribution of project.contributions)
        assert.ok(text.includes(contribution));
    }
  }
  assert.equal(text.split("Nimrod | https://nimrod.io/").length - 1, 2);
  assert.ok(text.includes(education[0].qualification));
  assert.ok(text.includes("Next.js (some experience)"));
  assert.ok(text.includes("AWS (some experience)"));
  assert.ok(text.includes("NoSQL (strongest)"));
  assert.ok(!/[\u2010-\u2015]/.test(text));
});

test("PDF generation is valid, bounded, and rejects sections that would be clipped", async () => {
  const pdf = await resumePdf();
  assert.equal(pdf.bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.bytes.subarray(-20).toString().includes("%%EOF"));
  assert.ok(pdf.pages >= 2 && pdf.pages <= 3);
  // Count the PDF's actual page objects, including any added implicitly by text overflow.
  assert.equal(
    (pdf.bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length,
    pdf.pages,
  );
  assert.ok(pdf.bytes.length < 100_000);
  await assert.rejects(
    resumePdf([[{ text: "A long responsibility. ".repeat(1500) }]]),
    /exceeds one page/,
  );
});

test("exports retain career order and overlapping employment periods", () => {
  const groups = resumeGroups();
  const text = resumeText(groups);
  const jobHeadings = groups
    .flat()
    .filter((line) => line.bold && line.text.includes(" | ") && !line.link);
  assert.equal(jobHeadings.length, experience.length);
  assert.ok(
    text.indexOf("Nov 2024 - Present") < text.indexOf("Aug 2024 - Nov 2024"),
  );
  assert.ok(
    text.indexOf("Aug 2024 - Nov 2024") < text.indexOf("Aug 2020 - Jul 2024"),
  );
});
