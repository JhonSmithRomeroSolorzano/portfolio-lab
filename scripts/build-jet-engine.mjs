import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import * as k from "../.opencode/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../.opencode/skills/anatomy/kit/lathe.mjs";
import * as A from "../.opencode/skills/anatomy/kit/audit.mjs";
import { ENGINE_CENTER, ROTORS } from "../src/domain/playground/jet-engine.ts";
import { triangulate } from "../src/domain/playground/engine-depth.ts";

const file = new URL(
  "../src/features/playground/jet-engine/engine-art.json",
  import.meta.url,
);
const F = G.frameAlong([0, 0, ENGINE_CENTER], [1, 0, 0]);
// A cropped wing section supplies the fixed structural boundary of the figure.
const wingZ = 228;
const wingSpans = [-160, -84, -12, 66, 143];
const wingFrame = G.frameAlong([8, 0, wingZ], [0.38, 1, 0]);
const wingProfile = [
  [0, 3],
  [-3, 0],
  [-124, 0],
  [-136, 1],
  [-105, 4],
  [-35, 12],
  [-8, 10],
  [-1, 7],
];
const wingPoint = (span, chord, height) =>
  G.add3(
    wingFrame.o,
    G.add3(
      G.mul3(wingFrame.a, span),
      G.add3(G.mul3(wingFrame.u, chord), G.mul3(wingFrame.v, height)),
    ),
  );
const P = k.fitProjection(
  [
    ...wingSpans.flatMap((span) =>
      wingProfile.map(([chord, h]) => wingPoint(span, chord, h)),
    ),
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
const assemblies = new Set();
function put(name, layer, svg, shape, at, assembly = name) {
  const item = R.put({
    name,
    piece: assembly,
    assembly,
    layer,
    svg,
    at,
    shapes: [].concat(shape).map((s) => R.solid(s)),
  });
  if (!assemblies.has(assembly)) {
    assemblies.add(assembly);
    serial++;
  }
  return item;
}
for (let i = 0; i < wingSpans.length - 1; i++) {
  const y0 = wingSpans[i],
    y1 = wingSpans[i + 1];
  const name = `wing.skin.${i}`;
  const item = put(
    name,
    "back",
    k.solidSvg(G.prismOf(wingFrame, wingProfile, y0, y1, P), { tone: "lo" }),
    A.prism(wingFrame, wingProfile, y0, y1, { name, ground: true }),
    wingPoint((y0 + y1) / 2, -68, 4),
  );
  // Panel seams and fasteners sit on the wing skin and meet its span boundaries.
  item.svg += k.lineSvg(
    k.pathOf(
      [wingPoint(y0, -105, 4), wingPoint(y1, -105, 4)].map((p) => k.iso(p, P)),
    ),
    { tone: "lo" },
  );
  item.svg += k.dotsSvg(
    Array.from({ length: 6 }, (_, n) =>
      k.iso(
        wingPoint(y0 + ((y1 - y0) * (n + 0.5)) / 6, -102, 4 + (3 * 8) / 70),
        P,
      ),
    ),
    { size: 0.55, tone: "lo" },
  );
}
const pylonFrame = G.frameAlong([0, 0, 0], [0, -1, 0]);
const pylonPolygon = [
  [-35, 167],
  [68, 167],
  [110, wingZ],
  [14, wingZ],
];
put(
  "pylon.fairing",
  "back",
  k.solidSvg(G.prismOf(pylonFrame, pylonPolygon, 0, 10, P), { tone: "mid" }),
  A.prism(pylonFrame, pylonPolygon, 0, 10, { name: "pylon.fairing" }),
  [40, -5, 197],
);
// The curved saddle sits on the retained upper/rear nacelle, not in the cutaway.
for (const [i, [start, end, radius]] of [
  [-35, -10, 61],
  [-10, -6, 64],
  [-6, 68, 61],
].entries()) {
  const saddle = [
      ...Array.from({ length: 9 }, (_, j) => {
        const y = -14 + (14 * j) / 8;
        return [y, Math.sqrt(radius * radius - y * y)];
      }),
      [0, 65],
      [-14, 65],
    ],
    name = `pylon.saddle.${i}`;
  put(
    name,
    "back",
    k.solidSvg(G.prismOf(F, saddle, start, end, P), { tone: "hi" }),
    A.prism(F, saddle, start, end, { name }),
    [(start + end) / 2, -7, 165],
  );
}
for (const [i, x] of [0, 42].entries()) {
  const panel = [
      [x, 184],
      [x + 22, 184],
      [x + 35, 210],
      [x + 13, 210],
    ],
    name = `pylon.access.${i}`;
  const item = put(
    name,
    "front",
    k.solidSvg(G.prismOf(pylonFrame, panel, -0.7, 0, P), { tone: "mid" }),
    A.prism(pylonFrame, panel, -0.7, 0, { name }),
    [x + 17, 0.35, 197],
  );
  item.svg += k.dotsSvg(
    [
      [x + 4, 188],
      [x + 20, 188],
      [x + 29, 206],
      [x + 15, 206],
    ].map(([px, z]) => k.iso([px, 0.7, z], P)),
    { size: 0.6, tone: "hi" },
  );
}

function ring(name, s0, s1, ri, ro, layer = "front") {
  const shape = A.ring(F, s0, s1, ri, ro, { name, steps: 48 });
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
    A.solid(F, profile, { name, steps: 24 }),
    [(s0 + s1) / 2, 0, ENGINE_CENTER],
  );
}
for (const [index, x] of [-138, -10, 134].entries()) {
  // Separate convex sectors keep the cutaway open instead of filling its hull.
  sectorPair(`nacelle.band.${index}`, x, x + 4, 61, 64);
}
function sector(name, s0, s1, ri, ro, a0, a1, layer) {
  const count = Math.ceil((a1 - a0) / (Math.PI / 20));
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
    const edges = [];
    for (const s of [s0, s1])
      for (const radius of [ri, ro])
        edges.push(
          k.pathOf([
            k.iso(G.pointOf(F, s, radius, a), P),
            k.iso(G.pointOf(F, s, radius, b), P),
          ]),
        );
    for (const boundary of [i === 0 ? a : null, i === count - 1 ? b : null])
      if (boundary !== null)
        edges.push(
          k.pathOf(
            [
              k.iso(G.pointOf(F, s0, ri, boundary), P),
              k.iso(G.pointOf(F, s0, ro, boundary), P),
              k.iso(G.pointOf(F, s1, ro, boundary), P),
              k.iso(G.pointOf(F, s1, ri, boundary), P),
            ],
            true,
          ),
        );
    const panelName = `${name}.panel.${i}`;
    const item = put(
      panelName,
      layer,
      k.solidSvg(
        { ...paths, outline: "", crease: "" },
        { tone: "mid", crease: "none" },
      ) + k.lineSvg(edges.join(""), { tone: "mid" }),
      A.prism(F, polygon, s0, s1, { name: panelName }),
      [
        (s0 + s1) / 2,
        (Math.cos((a + b) / 2) * (ri + ro)) / 2,
        ENGINE_CENTER + (Math.sin((a + b) / 2) * (ri + ro)) / 2,
      ],
      name,
    );
    item.angular = [a, b];
  }
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
// Closed stepped shoulders join different liner diameters without an axial air gap.
for (let i = 0; i < sections.length - 1; i++) {
  const current = sections[i],
    next = sections[i + 1];
  sectorPair(
    `core.joint.${i}`,
    current[1],
    next[0],
    Math.min(current[2], next[2]),
    Math.max(current[3], next[3]),
  );
}
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
    A.solid(F, shaft, { name, steps: 24 }),
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
  A.solid(F, spinner, { name: "intake.spinner", steps: 48 }),
  [-160, 0, ENGINE_CENTER],
);
// Fixed guide vanes support the front shaft bearing, behind the moving fan.
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
}
for (const item of R.items.filter((item) => item.assembly === "core.1.rear")) {
  const dots = Array.from({ length: 56 }, (_, i) => ({
    x: (i % 7) * 9,
    a: 2.2 + Math.floor(i / 7) * 0.35,
  })).filter((p) => p.a >= item.angular[0] && p.a < item.angular[1]);
  item.svg += k.dotsSvg(
    dots.map((p) => k.iso(G.pointOf(F, p.x, 31, p.a), P)),
    { size: 0.65, tone: "lo" },
  );
}
for (const [assembly, boundary, at] of [
  ["nacelle.shell.upper", Math.PI / 2, (x) => [x, 0, ENGINE_CENTER + 59]],
  ["nacelle.shell.lower", Math.PI * 2, (x) => [x, 59, ENGINE_CENTER]],
]) {
  const host = R.items.find(
    (item) =>
      item.assembly === assembly &&
      Math.min(
        Math.abs(item.angular[0] - boundary),
        Math.abs(item.angular[1] - boundary),
      ) < 1e-7,
  );
  host.svg += k.dotsSvg(
    Array.from({ length: 15 }, (_, i) => k.iso(at(-126 + i * 18), P)),
    { size: 0.65, tone: "hi" },
  );
}
// The optional full audit solves the same recorded static geometry, not proxies.
A.settle(R, P);
A.auditOrExit(R, P);
const ordered = [...R.items].sort((a, b) => a.key - b.key);
// Visibility is exported from the actual recorded surfaces, not object-centre keys.
const meshVertices = [],
  meshTriangles = [],
  meshGroups = [],
  vertexIds = new Map();
const V = G.viewOf(P);
function meshFace(world, normal) {
  if (G.dot3(normal, V) <= 1e-8) return;
  const projected = world.map((p) => {
    const [x, y] = k.iso(p, P);
    return [
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Number(G.dot3(p, V).toFixed(3)),
    ];
  });
  for (const t of triangulate(projected))
    for (const p of t.vertices) {
      const key = p.join(",");
      let id = vertexIds.get(key);
      if (id === undefined) {
        id = meshVertices.length / 3;
        vertexIds.set(key, id);
        meshVertices.push(...p);
      }
      meshTriangles.push(id);
    }
}
function meshShape(shape) {
  const { F: frame, poly } = shape;
  if (shape.kind === "prism") {
    const area = poly.reduce(
      (sum, p, i) =>
        sum +
        p[0] * poly[(i + 1) % poly.length][1] -
        poly[(i + 1) % poly.length][0] * p[1],
      0,
    );
    const ring = area > 0 ? poly : [...poly].reverse();
    const at = (s, p) =>
      G.add3(
        frame.o,
        G.add3(
          G.mul3(frame.a, s),
          G.add3(G.mul3(frame.u, p[0]), G.mul3(frame.v, p[1])),
        ),
      );
    const low = ring.map((p) => at(shape.s0, p)),
      high = ring.map((p) => at(shape.s1, p));
    meshFace(low, G.mul3(frame.a, -1));
    meshFace(high, frame.a);
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      meshFace(
        [low[i], low[j], high[j], high[i]],
        G.add3(
          G.mul3(frame.u, ring[j][1] - ring[i][1]),
          G.mul3(frame.v, ring[i][0] - ring[j][0]),
        ),
      );
    }
  } else if (shape.kind === "body") {
    const steps = shape.steps || 48;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length,
        ds = poly[j][0] - poly[i][0],
        dr = poly[j][1] - poly[i][1];
      for (let n = 0; n < steps; n++) {
        const a = (n * Math.PI * 2) / steps,
          b = ((n + 1) * Math.PI * 2) / steps,
          radial = G.radialOf(frame, (a + b) / 2);
        meshFace(
          [
            G.pointOf(frame, poly[i][0], poly[i][1], a),
            G.pointOf(frame, poly[j][0], poly[j][1], a),
            G.pointOf(frame, poly[j][0], poly[j][1], b),
            G.pointOf(frame, poly[i][0], poly[i][1], b),
          ],
          G.add3(G.mul3(radial, ds), G.mul3(frame.a, -dr)),
        );
      }
    }
  } else throw new Error(`Unrecorded visibility geometry: ${shape.kind}`);
}
for (const item of ordered) {
  const start = meshTriangles.length;
  for (const shape of item.shapes) meshShape(shape);
  meshGroups.push({
    name: item.name,
    assembly: item.assembly,
    legacyLayer: item.layer,
    start,
    count: meshTriangles.length - start,
  });
}
const output = await format(
  JSON.stringify(
    {
      parts: serial + ROTORS.reduce((n, r) => n + r.blades, 0),
      origin: k.iso([0, 0, 0], P),
      axes: [
        k.axisVector(P, [1, 0, 0]),
        k.axisVector(P, [0, 1, 0]),
        k.axisVector(P, [0, 0, 1]),
      ],
      view: [1100, 480],
      camera: { view: G.viewOf(P), light: G.lightOf(P) },
    },
    (_, value) =>
      // Keep far more than screen precision without serializing platform-specific
      // trailing bits from trigonometry into the checked-in projection metadata.
      typeof value === "number" ? Number(value.toFixed(8)) : value,
  ),
  { parser: "json" },
);
const outputs = new Map([[file, output]]);
const lastVertex = [0, 0, 0];
let lastIndex = 0;
const vertexDeltas = meshVertices.map((value, i) => {
  const axis = i % 3,
    integer = Math.round(value * (axis === 2 ? 1000 : 10)),
    delta = integer - lastVertex[axis];
  lastVertex[axis] = integer;
  return delta;
});
const indexDeltas = meshTriangles.map((value) => {
  const delta = value - lastIndex;
  lastIndex = value;
  return delta;
});
outputs.set(
  new URL(
    "../src/features/playground/jet-engine/engine-depth.json",
    import.meta.url,
  ),
  await format(
    JSON.stringify({
      version: 1,
      encoding: "delta-v1",
      vertices: vertexDeltas,
      triangles: indexDeltas,
      groups: meshGroups,
    }),
    { parser: "json" },
  ),
);
for (const theme of ["light", "dark"])
  for (const layer of ["back"]) {
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
    // Subpixel matching-color coverage seals raster seams between tangent panels;
    // it is not a new geometric surface or a painter-key/depth workaround.
    const css = `.iso-fill,.iso-top,.iso-shade{stroke-width:.3;stroke-linejoin:round}.iso-fill{fill:${palette[0]};stroke:${palette[0]}}.iso-top{fill:${palette[5]};stroke:${palette[5]}}${[0, 1, 2, 3].map((i) => `.iso-shade[data-shade="${i}"]{fill:${palette[i + 1]};stroke:${palette[i + 1]}}`).join("")}.iso-line{fill:none;stroke:${palette[6]};stroke-width:.65;stroke-linejoin:round;stroke-linecap:round}.iso-dots circle,.iso-face-text{fill:${palette[6]}}.iso-face-text{font-family:monospace}`;
    const body = ordered
      .map((p) => p.svg)
      .join("")
      .replace(/<path[^>]* d=""[^>]*\/>/g, "");
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
      throw new Error(
        `Engine art differs in ${destination.pathname.split("/").at(-1)}. Run npm run build:engine.`,
      );
  } else writeFileSync(destination, content);
}
console.log(
  `Jet engine: ${serial} fixed parts and ${ROTORS.reduce((n, r) => n + r.blades, 0)} moving blades.`,
);
