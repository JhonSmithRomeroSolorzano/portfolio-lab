import type { RetryAttempt } from "../retry-model";
export function retryDistribution(
  plain: RetryAttempt[],
  jitter: RetryAttempt[],
  recovery: number,
) {
  const end = Math.max(
    recovery,
    0,
    ...plain.map((r) => r.at),
    ...jitter.map((r) => r.at),
  );
  const bins = Array.from(
    { length: Math.floor(end / 100) + 1 },
    (_, index) => ({ at: index * 100, plain: 0, jitter: 0 }),
  );
  for (const row of plain) bins[Math.floor(row.at / 100)].plain++;
  for (const row of jitter) bins[Math.floor(row.at / 100)].jitter++;
  return {
    bins,
    end: bins.length * 100,
    peak: Math.max(1, ...bins.flatMap((b) => [b.plain, b.jitter])),
  };
}
