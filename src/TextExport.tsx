import { useId } from "react";
import { downloadText } from "./experiment-file";
/** Text remains available when a host browser does not support file downloads. */
export function TextExport({
  text,
  filename,
  kind,
  type,
}: {
  text: string;
  filename: string;
  kind: string;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="text-export">
      <div className="tool-actions">
        <button
          type="button"
          onClick={() => downloadText(text, filename, type)}
        >
          Download {kind}
        </button>
      </div>
      <details>
        <summary>View or copy {kind}</summary>
        <p>
          Select and copy this text to save it as <code>{filename}</code>.
        </p>
        <label htmlFor={id}>{kind} contents</label>
        <textarea
          id={id}
          className="export-text"
          value={text}
          rows={8}
          readOnly
          spellCheck={false}
          onFocus={(event) => event.target.select()}
        />
      </details>
    </div>
  );
}
