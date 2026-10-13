export type PuzzleRecord = {
  unassisted: number | null;
  assisted: number | null;
};
export const emptyRecord = (): PuzzleRecord => ({
  unassisted: null,
  assisted: null,
});

/** Unknown rotation history from older saves cannot establish a personal best. */
export function recordCompletion(
  record: PuzzleRecord,
  rotations: number | null,
  assisted: boolean,
): PuzzleRecord {
  if (rotations === null) return record;
  if (!Number.isSafeInteger(rotations) || rotations < 1)
    throw new RangeError("A completed run needs a positive rotation count.");
  const category = assisted ? "assisted" : "unassisted";
  return {
    ...record,
    [category]: Math.min(record[category] ?? Infinity, rotations),
  };
}
