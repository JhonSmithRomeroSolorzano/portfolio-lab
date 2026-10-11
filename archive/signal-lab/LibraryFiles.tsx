import { useId, useRef, useState } from "react";
import { TextExport } from "./TextExport";
import { exportLibrary, importLibrary } from "./library-file";
import type { PortableExperiment } from "./library-file";
import type { SavedExperiment } from "./experiment-library";
export function LibraryFiles({
  entries,
  onImport,
}: {
  entries: SavedExperiment[];
  onImport: (incoming: PortableExperiment[]) => void;
}) {
  const id = useId(),
    request = useRef(0);
  const [message, setMessage] = useState(
    "Imports keep existing saves and skip matching names and settings. Up to eight total.",
  );
  return (
    <details>
      <summary>Back up or import your library</summary>
      {entries.length > 0 && (
        <TextExport
          text={exportLibrary(entries)}
          filename="signal-lab-library.json"
          kind="library JSON"
        />
      )}
      <label htmlFor={id}>Import library JSON (up to 100 KB)</label>
      <input
        className="tool-file"
        id={id}
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          const current = ++request.current;
          if (!file) return;
          try {
            if (file.size > 100_000)
              throw new Error("Choose a library smaller than 100 KB.");
            const incoming = importLibrary(await file.text());
            if (current === request.current) {
              onImport(incoming);
              setMessage("Library merged. Existing saves were retained.");
            }
          } catch (error) {
            if (current === request.current)
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Could not import library.",
              );
          }
        }}
      />
      <p role="status">{message}</p>
    </details>
  );
}
