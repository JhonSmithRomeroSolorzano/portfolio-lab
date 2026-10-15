import { writeFileSync, readFileSync } from "node:fs";
import { format } from "prettier";
import * as k from "../.opencode/skills/anatomy/kit/iso-kit.mjs";

const destination = new URL(
  "../src/features/playground/cache-rescue/press-art.json",
  import.meta.url,
);
const base = { x: -142, y: -68, w: 284, d: 136, r: 7 };
const P = k.fitProjection(k.boxCorners(base, -15, 116), 600, 390, {
  pad: 28,
  azimuth: 38,
  elevation: 32,
});
const groups = { base: [], frame: [], head: [], front: [], card: [] };
let parts = 0;
function slab(group, x, y, w, d, z, h, tone = "mid", lit = false) {
  const plan = { x, y, w, d, r: Math.min(1.4, w / 4, d / 4) };
  groups[group].push(
    k.solidSvg(k.slabOf(plan, z, h, P, 2, Math.min(0.6, h / 4)), {
      tone,
      lit,
    }),
  );
  parts++;
}
function groove(group, plan, z) {
  groups[group].push(k.lineSvg(k.planOutline(plan, z, P, 3), { tone: "lo" }));
}

for (const [x, y] of k
  .corners(base, 20)
  .sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
  slab("base", x - 7, y - 7, 14, 14, -15, 5, "lo");
  slab("base", x - 5, y - 5, 10, 10, -10, 3, "mid");
}
slab("base", base.x, base.y, base.w, base.d, -7, 7, "lo");
groove("base", k.insetPlan(base, 5), 0);
for (const [x, y] of k.corners(base, 10)) {
  slab("base", x - 1.5, y - 1.5, 3, 3, 0, 0.7, "hi");
}
for (const x of [-117, 65]) {
  slab("base", x, -30, 52, 64, 0, 5, "mid");
  slab("base", x, -30, 52, 3, 5, 10, "mid");
  slab("base", x, -27, 3, 58, 5, 7, "mid");
  slab("base", x + 49, -27, 3, 58, 5, 7, "mid");
  groove("base", { x: x + 7, y: -20, w: 38, d: 44, r: 1 }, 5);
}
for (const x of [-43, 34]) {
  slab("frame", x - 5, -25, 19, 26, 0, 7, "lo");
  slab("frame", x, -20, 9, 16, 7, 89, "mid");
  slab("frame", x - 2, -22, 13, 20, 96, 5, "hi");
  for (const z of [23, 45, 67]) {
    groove("frame", { x, y: -20, w: 9, d: 16, r: 1 }, z);
  }
  slab("frame", x + 2, -17, 5, 10, 101, 3, "hi");
}
slab("frame", -47, -25, 98, 26, 104, 10, "mid");
slab("frame", -5, -13, 14, 2, 84, 20, "mid");
slab("frame", -5, -11, 2, 12, 84, 20, "mid");
groove("frame", { x: -41, y: -21, w: 86, d: 18, r: 1 }, 114);
for (const x of [-38, 37]) {
  slab("frame", x, -17, 3, 10, 114, 1, "hi");
}
slab("frame", -29, -23, 62, 35, 0, 8, "mid");
slab("frame", -25, -19, 54, 29, 8, 6, "hi");
slab("frame", -27, 20, 58, 27, 0, 5, "mid");
slab("frame", -27, 20, 3, 27, 5, 8, "mid");
slab("frame", 28, 20, 3, 27, 5, 8, "mid");
slab("frame", -24, 44, 52, 3, 5, 8, "mid");

slab("head", -22, -18, 48, 27, 48, 9, "hi");
slab("head", -18, -14, 40, 19, 44, 4, "hi", true);
slab("head", -34, -17, 12, 12, 50, 5, "mid");
slab("head", 26, -17, 8, 12, 50, 5, "mid");
slab("head", -3, -11, 10, 10, 57, 47, "mid");
for (const x of [-15, 16]) {
  slab("head", x, -13, 3, 3, 57, 1, "hi");
}

slab("front", -132, 48, 264, 9, 0, 0.8, "lo");
const ticks = k.topTicks(-126, 126, 6, 5, 48.5, 0.8, [3, 6], P);
groups.front.push(k.lineSvg(ticks.minor, { tone: "lo" }));
groups.front.push(k.lineSvg(ticks.major, { tone: "mid" }));
slab("front", 7, -11, 2, 12, 84, 20, "mid");
slab("front", -3, -1, 10, 2, 84, 20, "mid");
slab("front", -25, 59, 54, 7, 0, 1, "mid");
groups.front.push(
  k.faceTextSvg(k.topMatrix([2, 64], 1, P), "SINGLE FLIGHT", {
    size: 2.6,
    tone: "hi",
    anchor: "middle",
  }),
);
slab("card", -17, -11, 34, 22, 0, 0.4, "hi");
for (const y of [-5, 0, 5]) {
  groups.card.push(
    k.lineSvg(k.lineOnTop([-11, y], [y === 5 ? 2 : 11, y], 0.4, P), {
      tone: "lo",
      free: true,
    }),
  );
}
const output = await format(
  JSON.stringify({
    parts,
    groups: Object.fromEntries(
      Object.entries(groups).map(([name, paths]) => [name, paths.join("")]),
    ),
    axes: [
      k.axisVector(P, [1, 0, 0]),
      k.axisVector(P, [0, 1, 0]),
      k.axisVector(P, [0, 0, 1]),
    ],
  }),
  { parser: "json" },
);
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output) {
    throw new Error("Cache press art is stale. Run npm run build:press.");
  }
} else {
  writeFileSync(destination, output);
}
console.log(`Cache press: ${parts} solid parts; artwork reproduced.`);
