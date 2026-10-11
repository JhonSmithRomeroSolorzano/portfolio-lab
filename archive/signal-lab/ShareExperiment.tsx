import { useId, useState } from "react";
import { copyLink, shareScenarioUrl } from "./share-link";
import type { CopyResult } from "./share-link";
import type { Scenario } from "../../src/domain/simulation/simulation";

export function ShareExperiment({ scenario }: { scenario: Scenario }) {
  const [result, setResult] = useState<CopyResult | null>(null);
  const [copying, setCopying] = useState(false);
  const inputId = useId();

  async function share() {
    setCopying(true);
    const url = shareScenarioUrl(window.location.href, scenario);
    const writeText = navigator.clipboard
      ? (text: string) => navigator.clipboard.writeText(text)
      : undefined;
    setResult(await copyLink(url, writeText));
    setCopying(false);
  }

  return (
    <div className="share-experiment">
      <button
        className="share-button"
        type="button"
        onClick={share}
        disabled={copying}
      >
        {copying ? "Copying…" : "Copy experiment link"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="share-feedback" role="status">
        {result?.status === "copied"
          ? "Link copied. Share this exact setup."
          : result?.status === "manual"
            ? "Copy isn’t available here. Select the link below."
            : "Let someone else try your setup."}
      </p>
      {result?.status === "manual" && (
        <div className="manual-link">
          <label htmlFor={inputId}>Experiment link</label>
          <input
            id={inputId}
            type="text"
            readOnly
            value={result.url}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  );
}
