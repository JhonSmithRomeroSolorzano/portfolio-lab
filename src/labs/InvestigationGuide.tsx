import { useState } from "react";
import type { LabId } from "../lab-catalog";
import type { LabSetup } from "./lab-setup";
import { INVESTIGATIONS } from "./investigations";
export function InvestigationGuide({
  active,
  onOpen,
}: {
  active: LabId;
  onOpen: (setup: LabSetup) => void;
}) {
  const [guideId, setGuideId] = useState(INVESTIGATIONS[0].id);
  const [step, setStep] = useState<number | null>(null);
  const guide = INVESTIGATIONS.find((g) => g.id === guideId)!;
  const current = step === null ? null : guide.steps[step];
  const go = (index: number) => {
    setStep(index);
    onOpen(guide.steps[index].setup);
  };
  return (
    <details className="investigation-guide">
      <summary>
        Follow an investigation{" "}
        <span>Three short engineering walkthroughs</span>
      </summary>
      <div className="guide-body">
        <div className="lab-field">
          <label htmlFor="investigation-picker">Investigation</label>
          <select
            id="investigation-picker"
            value={guideId}
            onChange={(e) => {
              setGuideId(e.target.value);
              setStep(null);
            }}
          >
            {INVESTIGATIONS.map((g) => (
              <option value={g.id} key={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        {current ? (
          <>
            <div className="guide-step" role="status" aria-atomic="true">
              <span>
                Step {step! + 1} / {guide.steps.length}
              </span>
              <h4>{current.title}</h4>
              <p>{current.question}</p>
            </div>
            <details className="guide-evidence" key={`${guide.id}-${step}`}>
              <summary>What to look for</summary>
              <p>{current.evidence}</p>
            </details>
            {active !== current.setup.lab && (
              <p>
                This step uses a different lab. Reopen its setup to continue.
              </p>
            )}
            <div className="tool-actions">
              <button onClick={() => go(step! - 1)} disabled={step === 0}>
                Previous step
              </button>
              <button onClick={() => go(step!)}>Reopen step setup</button>
              {step! < guide.steps.length - 1 ? (
                <button onClick={() => go(step! + 1)}>Next step</button>
              ) : (
                <button onClick={() => setStep(null)}>
                  Finish investigation
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p>
              Explore a failure, inspect the evidence, and compare a remedy.
              Each step loads a known setup in one experiment. You can adjust it
              freely.
            </p>
            <button className="guide-start" onClick={() => go(0)}>
              Start investigation
            </button>
          </>
        )}
      </div>
    </details>
  );
}
