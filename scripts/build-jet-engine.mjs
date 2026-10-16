import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import * as k from "../.opencode/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../.opencode/skills/anatomy/kit/lathe.mjs";
import * as A from "../.opencode/skills/anatomy/kit/audit.mjs";
import { ENGINE_CENTER, ROTORS } from "../src/domain/playground/jet-engine.ts";

const file = new URL(
  "../src/features/playground/jet-engine/engine-art.json",
  import.meta.url,
);
const F = G.frameAlong([0, 0, ENGINE_CENTER], [1, 0, 0]);
const deck = { x: -190, y: -84, w: 370, d: 168, r: 8 };
const P = k.fitProjection(
  [
    ...k.boxCorners(deck, -12, 4),
    [-230, 0, 170],
    [310, 0, 170],
    [-180, -68, 170],
    [-180, 68, 34],
  ],
  1100,
  480,
  { pad: 36, azimuth: 117, elevation: 20 },
);
const R = A.recorder(P);
let serial = 0;
function put(name, layer, svg, shape, at) {
  R.put({
    name,
    piece: name,
    layer,
    svg,
    at,
    shapes: [].concat(shape).map((s) => R.solid(s)),
  });
  serial++;
}
function slab(name, plan, z, h, layer = "back") {
  put(
    name,
    layer,
    k.solidSvg(k.slabOf(plan, z, h, P, 4, Math.min(0.7, h / 4)), {
      tone: "mid",
    }),
    A.slab(plan, z, h, { name, ground: name.startsWith("stand.") }, 4),
    [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
  );
}
for (const [i, [x, y]] of k.corners(deck, 28).entries()) {
  slab(`stand.pad.${i}`, { x: x - 8, y: y - 8, w: 16, d: 16, r: 2 }, -12, 5);
  slab(`stand.foot.${i}`, { x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, -7, 7);
}
slab("stand.deck", deck, 0, 4);
for (const x of [-108, 105])
  slab(`stand.pedestal.${x}`, { x: x - 8, y: -7, w: 16, d: 14, r: 1.5 }, 4, 37);

function ring(name, s0, s1, ri, ro, layer = "front") {
  const shape = A.ring(F, s0, s1, ri, ro, { name });
  put(
    name,
    layer,
    k.solidSvg(
      G.ringBand(s0, s1, ri, ro, F, P, { steps: 48, hole: [s0, ri] }),
      { tone: "hi" },
    ),
    shape,
    [(s0 + s1) / 2, 0, ENGINE_CENTER],
  );
}
ring("intake.lip", -156, -144, 60, 65);
ring("exhaust.lip", 140, 146, 57, 62);
for (const [name, s0, s1] of [
  ["coupling.front", -134, -128],
  ["coupling.rear", 110, 114],
]) {
  const profile = [
    [s0, 9],
    [s1, 9],
  ];
  put(
    name,
    "back",
    k.solidSvg(G.solidOf(profile, F, P, { steps: 24 }), { tone: "hi" }),
    A.solid(F, profile, { name }),
    [(s0 + s1) / 2, 0, ENGINE_CENTER],
  );
}
for (const [index, x] of [-138, -10, 134].entries()) {
  // Separate convex sectors keep the cutaway open instead of filling its hull.
  sectorPair(`nacelle.band.${index}`, x, x + 4, 61, 64);
}
function sector(name, s0, s1, ri, ro, a0, a1, layer) {
  const pieces = [],
    shapes = [];
  const count = Math.ceil((a1 - a0) / (Math.PI / 24));
  for (let i = 0; i < count; i++) {
    const a = a0 + ((a1 - a0) * i) / count,
      b = a0 + ((a1 - a0) * (i + 1)) / count;
    const polygon = [
      [ri * Math.cos(a), ri * Math.sin(a)],
      [ro * Math.cos(a), ro * Math.sin(a)],
      [ro * Math.cos(b), ro * Math.sin(b)],
      [ri * Math.cos(b), ri * Math.sin(b)],
    ];
    const paths = G.prismOf(F, polygon, s0, s1, P);
    pieces.push(
      k.solidSvg(
        { ...paths, outline: "", crease: "" },
        { tone: "mid", crease: "none" },
      ),
    );
    shapes.push(A.prism(F, polygon, s0, s1, { name }));
  }
  const edges = [a0, a1].map((a) =>
    k.pathOf(
      [
        k.iso(G.pointOf(F, s0, ri, a), P),
        k.iso(G.pointOf(F, s0, ro, a), P),
        k.iso(G.pointOf(F, s1, ro, a), P),
        k.iso(G.pointOf(F, s1, ri, a), P),
      ],
      true,
    ),
  );
  for (const s of [s0, s1])
    for (const radius of [ri, ro])
      edges.push(
        k.pathOf(
          Array.from({ length: count + 1 }, (_, i) =>
            k.iso(G.pointOf(F, s, radius, a0 + ((a1 - a0) * i) / count), P),
          ),
        ),
      );
  pieces.push(k.lineSvg(edges.join(""), { tone: "mid" }));
  put(name, layer, pieces.join(""), shapes, [
    (s0 + s1) / 2,
    (Math.cos((a0 + a1) / 2) * (ri + ro)) / 2,
    ENGINE_CENTER + (Math.sin((a0 + a1) / 2) * (ri + ro)) / 2,
  ]);
}
function sectorPair(name, s0, s1, ri, ro) {
  const view = G.viewOf(P),
    turn = Math.atan2(view[2], view[1]);
  const a = Math.PI / 2 + turn,
    b = Math.PI * 1.5 + turn;
  sector(`${name}.upper`, s0, s1, ri, ro, Math.PI / 2, a, "front");
  sector(`${name}.rear`, s0, s1, ri, ro, a, b, "back");
  sector(`${name}.lower`, s0, s1, ri, ro, b, Math.PI * 2, "front");
}
sectorPair("nacelle.shell", -144, 140, 57, 61);
const sections = [
  [-104, -12, 28, 32],
  [-8, 66, 31, 35],
  [70, 112, 26, 30],
  [116, 144, 21, 25],
];
for (const [i, [s0, s1, ri, ro]] of sections.entries()) {
  sectorPair(`core.${i}`, s0, s1, ri, ro);
  for (const [j, a] of [2.1, 3.8, 5.4].entries()) {
    const r0 = ro,
      r1 = 57,
      delta = 0.035;
    const polygon = [
      [r0 * Math.cos(a - delta), r0 * Math.sin(a - delta)],
      [r1 * Math.cos(a - delta), r1 * Math.sin(a - delta)],
      [r1 * Math.cos(a + delta), r1 * Math.sin(a + delta)],
      [r0 * Math.cos(a + delta), r0 * Math.sin(a + delta)],
    ];
    const x = (s0 + s1) / 2;
    put(
      `mount.${i}.${j}`,
      a > 5 ? "front" : "back",
      k.solidSvg(G.prismOf(F, polygon, x - 2, x + 2, P), { tone: "mid" }),
      A.prism(F, polygon, x - 2, x + 2, { name: `mount.${i}.${j}` }),
      G.pointOf(F, x, (r0 + r1) / 2, a),
    );
  }
}
for (const [index, [s0, s1]] of [
  [-144, -134],
  [-128, 110],
  [114, 144],
].entries()) {
  const shaft = [
      [s0, 5],
      [s1, 5],
    ],
    name = `shaft.${index}`;
  put(
    name,
    "back",
    k.solidSvg(G.solidOf(shaft, F, P, { steps: 24 }), { tone: "hi" }),
    A.solid(F, shaft, { name }),
    [(s0 + s1) / 2, 0, ENGINE_CENTER],
  );
}
const spinner = [
  [-179, 0],
  [-173, 5, 1],
  [-157, 11, 1],
  [-144, 13],
];
put(
  "intake.spinner",
  "front",
  k.solidSvg(G.solidOf(spinner, F, P, { steps: 48 }), { tone: "hi" }),
  A.solid(F, spinner, { name: "intake.spinner" }),
  [-160, 0, ENGINE_CENTER],
);
// Fixed guide vanes support the front shaft bearing, behind the moving fan.
const guides = [];
for (let i = 0; i < 6; i++) {
  const a = (i * Math.PI) / 3,
    poly = [
      [9 * Math.cos(a), 9 * Math.sin(a)],
      [57 * Math.cos(a - 0.015), 57 * Math.sin(a - 0.015)],
      [57 * Math.cos(a + 0.015), 57 * Math.sin(a + 0.015)],
      [9 * Math.cos(a + 0.12), 9 * Math.sin(a + 0.12)],
    ];
  const svg = k.solidSvg(G.prismOf(F, poly, -132, -130, P), { tone: "lo" });
  put(
    `guide.${i}`,
    "middle",
    svg,
    A.prism(F, poly, -132, -130, { name: `guide.${i}` }),
    G.pointOf(F, -131, 33, a),
  );
  guides.push({ x: -131, polygon: poly });
}
const marks = [];
const liner = R.items.find((item) => item.name === "core.1.rear");
if (liner)
  liner.svg += k.dotsSvg(
    Array.from({ length: 56 }, (_, i) =>
      k.iso(G.pointOf(F, (i % 7) * 9, 31, 2.2 + Math.floor(i / 7) * 0.35), P),
    ),
    { size: 0.65, tone: "lo" },
  );
marks.push(
  k.lineSvg(k.planOutline(k.insetPlan(deck, 5), 4, P), { tone: "lo" }),
);
marks.push(
  k.dotsSvg(
    k.corners(deck, 10).map(([x, y]) => k.iso([x, y, 4], P)),
    { size: 1, tone: "hi" },
  ),
);
const plaque = { x: 95, y: 63, w: 63, d: 12, r: 1 };
slab("stand.plaque", plaque, 4, 0.7);
marks.push(
  k.faceTextSvg(k.topMatrix([126, 71], 4.7, P), "AIR / CORE", {
    size: 3,
    tone: "hi",
    anchor: "middle",
  }),
);
const screws = [];
for (let x = -126; x < 138; x += 18)
  screws.push(
    k.iso([x, 59, ENGINE_CENTER], P),
    k.iso([x, 0, ENGINE_CENTER + 59], P),
  );
marks.push(k.dotsSvg(screws, { size: 0.65, tone: "hi" }));
// The optional full audit solves the same recorded static geometry, not proxies.
A.settle(R, P);
A.auditOrExit(R, P);
const ordered = [...R.items].sort((a, b) => a.key - b.key);
const output = await format(
  JSON.stringify({
    parts: serial + ROTORS.reduce((n, r) => n + r.blades, 0),
    origin: k.iso([0, 0, 0], P),
    axes: [
      k.axisVector(P, [1, 0, 0]),
      k.axisVector(P, [0, 1, 0]),
      k.axisVector(P, [0, 0, 1]),
    ],
    view: [1100, 480],
    camera: { view: G.viewOf(P), light: G.lightOf(P) },
    guideMeshes: guides,
  }),
  { parser: "json" },
);
const outputs = new Map([[file, output]]);
for (const theme of ["light", "dark"])
  for (const layer of ["back", "front"]) {
    const palette =
      theme === "dark"
        ? [
            "#263748",
            "#1c2b3a",
            "#2a3e51",
            "#3a5267",
            "#4d677b",
            "#7290a3",
            "#a7bdcb",
          ]
        : [
            "#b6c2ca",
            "#8d9eaa",
            "#a5b5bf",
            "#bfccd3",
            "#d1dce0",
            "#edf1ee",
            "#596f80",
          ];
    const css = `.iso-fill{fill:${palette[0]}}.iso-top{fill:${palette[5]}}${[0, 1, 2, 3].map((i) => `.iso-shade[data-shade="${i}"]{fill:${palette[i + 1]}}`).join("")}.iso-line{fill:none;stroke:${palette[6]};stroke-width:.65;stroke-linejoin:round;stroke-linecap:round}.iso-dots circle,.iso-face-text{fill:${palette[6]}}.iso-face-text{font-family:monospace}`;
    const body =
      ordered
        .filter((p) => p.layer === layer)
        .map((p) => p.svg)
        .join("") + (layer === "front" ? marks.join("") : "");
    outputs.set(
      new URL(
        `../src/features/playground/jet-engine/engine-${layer}-${theme}.svg`,
        import.meta.url,
      ),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 480"><style>${css}</style>${body}</svg>\n`,
    );
  }
for (const [destination, content] of outputs) {
  if (process.argv.includes("--check")) {
    if (readFileSync(destination, "utf8") !== content)
      throw new Error("Engine art is stale. Run npm run build:engine.");
  } else writeFileSync(destination, content);
}
console.log(
  `Jet engine: ${serial} fixed parts and ${ROTORS.reduce((n, r) => n + r.blades, 0)} moving blades.`,
);
