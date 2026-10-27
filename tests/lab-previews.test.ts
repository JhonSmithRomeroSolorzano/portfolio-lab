import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experiences } from "../src/features/playground/catalog";

test("each lab has a bounded static WebP preview and an engineering descriptor", async () => {
  let total = 0;
  for (const experience of experiences) {
    const image = await readFile(
      new URL(`../public/lab-previews/${experience.id}.webp`, import.meta.url),
    );
    assert.equal(image.toString("ascii", 0, 4), "RIFF");
    assert.equal(image.toString("ascii", 8, 12), "WEBP");
    assert.ok(image.length <= 20 * 1024, `${experience.id} exceeds 20 KiB`);
    assert.ok(
      experience.descriptor.length > 10 && experience.descriptor.length <= 60,
    );
    assert.ok(experience.description.length > 0);
    total += image.length;
  }
  assert.ok(total <= 120 * 1024, "Combined lab previews exceed 120 KiB");
});
