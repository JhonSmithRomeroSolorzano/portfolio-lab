import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import * as k from "../.opencode/skills/anatomy/kit/iso-kit.mjs";
import { LOCKS } from "../src/domain/playground/pin-lock.ts";

const destination = new URL(
  "../src/features/playground/pin-lock/lock-art.json",
  import.meta.url,
);
const cuts = LOCKS.map((lock) => lock.cuts);
const xs = [-72, -36, 0, 36, 72];
const base = { x: -132, y: -45, w: 344, d: 112, r: 6 };
const P = k.fitProjection(
  [
    ...k.boxCorners(base, -15, 0),
    ...k.boxCorners({ x: -108, y: -26, w: 216, d: 48, r: 2 }, 142, 198),
  ],
  800,
  480,
  { pad: 30, azimuth: 70, elevation: 24 },
);
let parts = 0;
function slab(x, y, w, d, z, h, lit = false) {
  parts++;
  return k.solidSvg(
    k.slabOf(
      { x, y, w, d, r: Math.min(1.5, w / 4, d / 4) },
      z,
      h,
      P,
      3,
      Math.min(0.6, h / 4),
    ),
    { tone: "mid", lit },
  );
}
const floor = [];
for (const [x, y] of k
  .corners(base, 18)
  .sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
  floor.push(
    slab(x - 7, y - 7, 14, 14, -15, 5),
    slab(x - 5, y - 5, 10, 10, -10, 3),
  );
}
floor.push(slab(base.x, base.y, base.w, base.d, -7, 7));
floor.push(
  k.lineSvg(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: "lo" }),
);
for (const [x, y] of k.corners(base, 10))
  floor.push(slab(x - 1.5, y - 1.5, 3, 3, 0, 1));
for (const y of [-12, 10]) {
  for (const x of [-103, 90]) floor.push(slab(x, y - 2, 13, 8, 0, 4));
  floor.push(slab(-108, y, 310, 4, 4, 4));
}
const housing = [slab(-108, -26, 216, 5, 0, 142)];
for (const x of [-108, 101]) housing.push(slab(x, -21, 7, 9, 0, 142));
const beam = slab(-108, -21, 216, 39, 142, 6);
for (const x of [-111, 108]) housing.push(slab(x, -21, 3, 31, 76, 4));
for (const x of xs) {
  housing.push(
    slab(x - 11, -17, 22, 7, 88, 8),
    slab(x - 11, -17, 22, 7, 125, 6),
  );
}
const bolt = [slab(-104, -10, 208, 24, 8, 8)];
for (const x of [79, 96]) bolt.push(slab(x, 14, 4, 14, 10, 6));
bolt.push(slab(77, 25, 25, 5, 10, 10));
const upper =
  slab(-6, -6, 12, 12, 0, 18) +
  k.dotsSvg([k.iso([0, 0, 18], P)], { size: 1, tone: "hi" });
const lifters = Array.from({ length: 6 }, (_, level) =>
  level ? slab(-2, -2, 4, 4, 16, level * 8) : "",
);
const lower = cuts.map((pattern) =>
  pattern.map((cut) => slab(-6, -6, 12, 12, 16, 62 - cut * 8, true)),
);
const springs = cuts.map((pattern) =>
  pattern.map((cut, index) =>
    Array.from({ length: 6 }, (_, level) => {
      const bottom = 78 + (level - cut) * 8 + 18;
      const points = [k.iso([xs[index], 0, bottom], P)];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48,
          angle = t * Math.PI * 12;
        points.push(
          k.iso(
            [
              xs[index] + 3.5 * Math.cos(angle),
              3.5 * Math.sin(angle),
              bottom + 1 + t * (141 - bottom - 2),
            ],
            P,
          ),
        );
      }
      points.push(k.iso([xs[index], 0, 142], P));
      return k.pathOf(points);
    }),
  ),
);
const cover = [slab(-112, -28, 224, 50, 148, 7)];
cover.push(
  k.lineSvg(k.planOutline({ x: -107, y: -23, w: 214, d: 40, r: 2 }, 155, P), {
    tone: "lo",
  }),
);
for (const [x, y] of k.corners({ x: -112, y: -28, w: 224, d: 50, r: 2 }, 8))
  cover.push(slab(x - 1.5, y - 1.5, 3, 3, 155, 1));
const front = [slab(-119, 51, 300, 7, 0, 0.7)];
const ticks = k.topTicks(-115, 177, 8, 5, 51.4, 0.7, [2.5, 5], P);
front.push(
  k.lineSvg(ticks.minor, { tone: "lo" }),
  k.lineSvg(ticks.major, { tone: "mid" }),
);
front.push(slab(100, 59, 68, 6, 0, 0.8));
front.push(
  k.faceTextSvg(k.topMatrix([134, 64], 0.8, P), "PIN & BOLT", {
    size: 2.8,
    tone: "hi",
    anchor: "middle",
  }),
);
const shear = k.pathOf([k.iso([-108, 8, 78], P), k.iso([108, 8, 78], P)]);
const output = await format(
  JSON.stringify({
    parts,
    origin: k.iso([0, 0, 0], P),
    axes: [
      k.axisVector(P, [1, 0, 0]),
      k.axisVector(P, [0, 1, 0]),
      k.axisVector(P, [0, 0, 1]),
    ],
    xs,
    cuts,
    floor: floor.join(""),
    housing: housing.join(""),
    beam,
    bolt: bolt.join(""),
    cover: cover.join(""),
    front: front.join(""),
    upper,
    lifters,
    lower,
    springs,
    shear,
    shearEnds: k.dotsSvg([k.iso([-108, 8, 78], P), k.iso([108, 8, 78], P)], {
      size: 1.2,
      tone: "hi",
    }),
  }),
  { parser: "json" },
);
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output)
    throw new Error("Lock art is stale. Run npm run build:lock.");
} else writeFileSync(destination, output);
console.log(`Pin & bolt: ${parts} authored solids; artwork reproduced.`);
