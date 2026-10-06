export function parseRequestRate(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const rate = Number(value);
  return Number.isInteger(rate) && rate >= 1 && rate <= 600 ? rate : null;
}
