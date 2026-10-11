import { useId, useRef, useState } from "react";
import { TextExport } from "./TextExport";
import { exportComparison, importComparison } from "./comparison-file";
import type { ComparisonSnapshot } from "./comparison-file";
export function ComparisonFiles({
  value,
  onImport,
}: {
  value: ComparisonSnapshot | null;
  onImport: (value: ComparisonSnapshot) => void;
}) {
  const id = useId(),
    request = useRef(0);
  const [notice, setNotice] = useState(
    "A comparison file contains both setups. Results are recalculated.",
  );
  return (
    <div className="comparison-files">
      {value && (
        <TextExport
          text={exportComparison(value)}
          filename="signal-lab-comparison.json"
          kind="comparison JSON"
        />
      )}
      <label htmlFor={id}>Import comparison JSON (up to 100 KB)</label>
      <input
        id={id}
        className="tool-file"
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          const current = ++request.current;
          if (!file) return;
          try {
            if (file.size > 100_000)
              throw new Error("Choose a comparison smaller than 100 KB.");
            const pair = importComparison(await file.text());
            if (current === request.current) {
              onImport(pair);
              setNotice("Both setups loaded. Results have been recalculated.");
            }
          } catch (error) {
            if (current === request.current)
              setNotice(
                error instanceof Error
                  ? error.message
                  : "Could not read this comparison.",
              );
          }
        }}
      />
      <p role="status">{notice}</p>
    </div>
  );
}
