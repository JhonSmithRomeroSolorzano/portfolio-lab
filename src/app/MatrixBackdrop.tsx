import { useEffect, useRef } from "react";
import { createMatrixRain } from "./matrix-rain-renderer";
import type { MatrixRainRenderer } from "./matrix-rain-renderer";
import { RAIN_GLYPHS } from "./matrix-rain-model";

export function MatrixBackdrop({
  paused,
  onAvailabilityChange,
}: {
  paused: boolean;
  onAvailabilityChange: (available: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<MatrixRainRenderer | undefined>(undefined);
  useEffect(() => {
    const drawing = canvas.current;
    if (!drawing) return;
    const rain = createMatrixRain(drawing);
    renderer.current = rain;
    onAvailabilityChange(Boolean(rain));
    return () => {
      rain?.dispose();
      renderer.current = undefined;
    };
  }, [onAvailabilityChange]);
  useEffect(() => {
    renderer.current?.setPaused(paused);
  }, [paused]);
  return (
    <div className="matrix-backdrop" aria-hidden="true" data-paused={paused}>
      <svg
        className="matrix-still"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <pattern
            id="matrix-still-pattern"
            width="160"
            height="260"
            patternUnits="userSpaceOnUse"
          >
            {Array.from({ length: 16 }, (_, column) => (
              <text
                key={column}
                x={column * 10 + 5}
                y={-column * 7}
                writingMode="vertical-rl"
                letterSpacing="4"
                opacity={0.2 + (column % 4) * 0.12}
              >
                {RAIN_GLYPHS.slice(column, column + 22)}
              </text>
            ))}
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#matrix-still-pattern)" />
      </svg>
      <canvas className="matrix-canvas" ref={canvas} />
    </div>
  );
}
