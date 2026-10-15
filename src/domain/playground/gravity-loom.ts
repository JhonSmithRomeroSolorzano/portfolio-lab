export type LoomPoint = { x: number; y: number };
export type LoomParticle = LoomPoint & { vx: number; vy: number };
export type LoomFlow = "orbit" | "weave";
export const MAX_ATTRACTORS = 4;
export const defaultAttractors: readonly LoomPoint[] = [
  { x: -0.36, y: 0 },
  { x: 0.36, y: 0 },
];
export const loomPlacements = [
  { label: "Center", x: 0, y: 0 },
  { label: "Upper left", x: -0.5, y: -0.45 },
  { label: "Upper right", x: 0.5, y: -0.45 },
  { label: "Lower left", x: -0.5, y: 0.45 },
  { label: "Lower right", x: 0.5, y: 0.45 },
] as const;

export function addLoomAttractor(
  points: readonly LoomPoint[],
  point: LoomPoint,
): LoomPoint[] {
  if (points.length >= MAX_ATTRACTORS) return [...points];
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error("Attractor coordinates must be finite.");
  return [
    ...points,
    {
      x: Math.max(-1, Math.min(1, point.x)),
      y: Math.max(-1, Math.min(1, point.y)),
    },
  ];
}

export function moveLoomAttractor(
  points: readonly LoomPoint[],
  index: number,
  point: LoomPoint,
): LoomPoint[] {
  if (!Number.isInteger(index) || index < 0 || index >= points.length)
    return [...points];
  const moved = addLoomAttractor([], point)[0];
  return points.map((current, i) => (i === index ? moved : current));
}

export function seedLoom(count: number): LoomParticle[] {
  if (!Number.isInteger(count) || count < 1 || count > 120)
    throw new Error("Loom particle count must be between 1 and 120.");
  return Array.from({ length: count }, (_, i) => {
    const angle = i * 2.3999632297;
    const radius = 0.22 + (i % 13) * 0.026;
    const center = defaultAttractors[i % 2];
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      vx: -Math.sin(angle) * 0.4,
      vy: Math.cos(angle) * 0.4,
    };
  });
}

/** Softened attraction plus swirl is artistic field motion, not orbital physics. */
export function stepLoom(
  particles: readonly LoomParticle[],
  attractors: readonly LoomPoint[],
  flow: LoomFlow,
  strength: number,
  heldIndex?: number,
): LoomParticle[] {
  if (!Number.isFinite(strength) || strength < 0.5 || strength > 1.5)
    throw new Error("Flow strength must be between 0.5 and 1.5.");
  if (
    attractors.length > MAX_ATTRACTORS ||
    attractors.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        Math.abs(p.x) > 1 ||
        Math.abs(p.y) > 1,
    )
  )
    throw new Error("Invalid attractor field.");
  return particles.map((p) => {
    // A soft frame turns threads before the safety boundary, avoiding hard
    // corners in the artwork while keeping extreme user fields contained.
    const edgeForce = (value: number) =>
      Math.sign(value) * Math.max(0, Math.abs(value) - 0.88) ** 2 * 75;
    let ax = -p.x * 0.12 - edgeForce(p.x);
    let ay = -p.y * 0.12 - edgeForce(p.y);
    attractors.forEach((center, i) => {
      const dx = center.x - p.x;
      const dy = center.y - p.y;
      const distance = dx * dx + dy * dy + 0.08;
      const spin = flow === "weave" && i % 2 ? -1 : 1;
      const pull = i === heldIndex ? 1.8 : 0.16;
      const swirl = i === heldIndex ? 0.08 : 0.22;
      ax += ((dx * pull - dy * spin * swirl) * strength) / distance;
      ay += ((dy * pull + dx * spin * swirl) * strength) / distance;
    });
    let vx = (p.vx + ax / 60) * 0.994;
    let vy = (p.vy + ay / 60) * 0.994;
    const speed = Math.hypot(vx, vy);
    if (speed > 1.2) {
      vx *= 1.2 / speed;
      vy *= 1.2 / speed;
    }
    let x = p.x + vx / 60;
    let y = p.y + vy / 60;
    // Reflect at the frame instead of teleporting and drawing cross-frame trails.
    if (Math.abs(x) > 1) {
      x = Math.sign(x);
      vx *= -0.8;
    }
    if (Math.abs(y) > 1) {
      y = Math.sign(y);
      vy *= -0.8;
    }
    return { x, y, vx, vy };
  });
}

/** A deterministic finished drawing for the initial view and static alternatives. */
export function createLoomScene(
  attractors: readonly LoomPoint[],
  flow: LoomFlow,
  strength: number,
  count = 72,
) {
  let particles = seedLoom(count);
  const trails: LoomPoint[][] = particles.map((p) => [{ x: p.x, y: p.y }]);
  for (let step = 1; step <= 180; step++) {
    particles = stepLoom(particles, attractors, flow, strength);
    if (step % 3 === 0)
      particles.forEach((p, i) => trails[i].push({ x: p.x, y: p.y }));
  }
  return { particles, trails };
}

export function loomPreview(
  attractors: readonly LoomPoint[],
  flow: LoomFlow,
  strength: number,
  count = 72,
): LoomPoint[][] {
  return createLoomScene(attractors, flow, strength, count).trails;
}
