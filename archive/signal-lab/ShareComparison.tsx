import { useId, useState } from "react";
import { copyLink } from "./share-link";
import { shareComparisonUrl } from "./comparison-link";
import type { ComparisonSnapshot } from "./comparison-file";
export function ShareComparison({ baseline, current }: ComparisonSnapshot) {
  const id = useId();
  const [message, setMessage] = useState(
    "This link includes both setups and opens the comparison.",
  );
  const [busy, setBusy] = useState(false);
  const url = shareComparisonUrl(window.location.href, baseline, current);
  return (
    <div className="share-experiment">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await copyLink(
            url,
            navigator.clipboard
              ? (t) => navigator.clipboard.writeText(t)
              : undefined,
          );
          setMessage(
            result.status === "copied"
              ? "Comparison link copied."
              : "Select and copy the link below.",
          );
          setBusy(false);
        }}
      >
        Copy comparison link
      </button>
      <p role="status">{message}</p>
      <div className="manual-link">
        <label htmlFor={id}>Comparison link</label>
        <input
          id={id}
          value={url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
    </div>
  );
}
