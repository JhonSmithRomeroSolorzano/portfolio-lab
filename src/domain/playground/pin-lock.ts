export const PIN_MAX = 5;
export const LOCKS = [
  { name: "First cut", cuts: [2, 4, 1, 3, 2], start: [0, 2, 3, 0, 4] },
  { name: "High & low", cuts: [5, 1, 4, 0, 3], start: [2, 3, 1, 2, 0] },
  { name: "Staircase", cuts: [1, 2, 3, 4, 5], start: [3, 0, 1, 2, 3] },
] as const;

export function pinLevel(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("Invalid pin height.");
  return Math.max(0, Math.min(PIN_MAX, Math.round(value)));
}

export function lockState(cuts: readonly number[], levels: readonly number[]) {
  if (
    cuts.length !== 5 ||
    levels.length !== 5 ||
    [...cuts, ...levels].some(
      (value) => !Number.isInteger(value) || value < 0 || value > PIN_MAX,
    )
  )
    throw new RangeError("A lock needs five valid pin heights.");
  const pins = levels.map((level, index) =>
    level === cuts[index] ? "aligned" : level < cuts[index] ? "low" : "high",
  );
  const blockers = pins.flatMap((state, index) =>
    state === "aligned" ? [] : [index + 1],
  );
  return {
    pins,
    blockers,
    matched: 5 - blockers.length,
    canOpen: blockers.length === 0,
  };
}
