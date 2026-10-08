import { useId, useRef, useState } from "react";
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
  const fallback = useRef<HTMLDetailsElement>(null);
  const content = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  return (
    <div className="text-export">
      <div className="tool-actions">
        <button
          type="button"
          onClick={() => {
            try {
              downloadText(text, filename, type);
              setMessage(
                "Download requested. If no file appears, use the copyable text below.",
              );
            } catch {
              setMessage(
                "Downloads aren’t available here. The export is ready to copy below.",
              );
              if (fallback.current) fallback.current.open = true;
              content.current?.focus();
              content.current?.select();
            }
          }}
        >
          Download {kind}
        </button>
      </div>
      <p role="status" aria-atomic="true">
        {message}
      </p>
      <details ref={fallback}>
        <summary>View or copy {kind}</summary>
        <p>
          Select and copy this text to save it as <code>{filename}</code>.
        </p>
        <label htmlFor={id}>{kind} contents</label>
        <textarea
          id={id}
          ref={content}
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
