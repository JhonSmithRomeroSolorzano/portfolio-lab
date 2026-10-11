import { useId, useState } from "react";
import type { RetryAttempt } from "../../../src/domain/simulation/retry-model";
import { retryDistribution } from "../../../src/domain/simulation/retry-distribution";
export function RetryDistribution({
  plain,
  jitter,
  recovery,
}: {
  plain: RetryAttempt[];
  jitter: RetryAttempt[];
  recovery: number;
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const { bins, end, peak } = retryDistribution(plain, jitter, recovery);
  const index = Math.min(selected, bins.length - 1),
    bin = bins[index];
  const width = 640 / bins.length;
  return (
    <div className="retry-distribution">
      <div className="timeline-caption">
        <strong>Where attempts cluster</strong>
        <span>Blue: no jitter · striped: full jitter</span>
      </div>
      <svg
        viewBox="0 0 700 210"
        role="img"
        aria-label={`Attempt distribution. Both policies use the same 0 to ${end} millisecond axis and 0 to ${peak} attempts per 100 millisecond scale. Exact counts are available below.`}
      >
        <defs>
          <pattern
            id={`${id}-stripes`}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(25)"
          >
            <rect width="2" height="5" fill="currentColor" />
          </pattern>
        </defs>
        {[0, 1].map((lane) => (
          <g key={lane} transform={`translate(40 ${lane * 90 + 12})`}>
            <line
              x1="0"
              x2="640"
              y1="65"
              y2="65"
              stroke="currentColor"
              opacity=".3"
            />
            <text x="-8" y="12" textAnchor="end">
              {peak}
            </text>
            <text x="-8" y="68" textAnchor="end">
              0
            </text>
            <rect
              x={index * width}
              y="0"
              width={width}
              height="65"
              fill="currentColor"
              opacity=".1"
            />
            {bins.map((b, i) => {
              const height = ((lane === 0 ? b.plain : b.jitter) / peak) * 60;
              return (
                <rect
                  key={b.at}
                  x={i * width + 0.5}
                  y={65 - height}
                  width={Math.max(0.5, width - 1)}
                  height={height}
                  fill={lane === 0 ? "var(--signal)" : `url(#${id}-stripes)`}
                />
              );
            })}
            <line
              x1={(recovery / end) * 640}
              x2={(recovery / end) * 640}
              y1="0"
              y2="65"
              stroke="#eab978"
              strokeDasharray="3 3"
            />
          </g>
        ))}
        <text x="40" y="205">
          0 ms
        </text>
        <text x="680" y="205" textAnchor="end">
          {end} ms
        </text>
      </svg>
      <p>
        Top: no jitter. Bottom: seeded full jitter. Dashed line: service
        recovery at {recovery} ms. Includes the eight initial attempts.
      </p>
      <label htmlFor={id}>
        Inspect 100 ms window: {bin.at}–{bin.at + 100} ms (end excluded)
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={bins.length - 1}
        value={index}
        onChange={(e) => setSelected(Number(e.target.value))}
      />
      <p role="status">
        {bin.plain} attempts without jitter · {bin.jitter} with jitter in this
        window.
      </p>
    </div>
  );
}
