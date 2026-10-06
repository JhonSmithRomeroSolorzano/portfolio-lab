import { useId, useState } from "react";
import { LIBRARY_KEY, loadLibrary } from "./experiment-library";
import type { SavedExperiment } from "./experiment-library";
import type { Scenario } from "./simulation";
export function ExperimentLibrary({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (s: Scenario) => void;
}) {
  const [entries, setEntries] = useState(loadLibrary);
  const [name, setName] = useState("");
  const [message, setMessage] = useState(
    "Stored only in this browser. Up to eight experiments.",
  );
  const id = useId();
  function save(next: SavedExperiment[]) {
    setEntries(next);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      setMessage("Experiment library saved in this browser.");
    } catch {
      setMessage(
        "Browser storage is unavailable. Changes will last only for this visit.",
      );
    }
  }
  return (
    <details className="tool-panel">
      <summary>Your experiment library</summary>
      <div className="tool-content">
        <label htmlFor={id}>Name this setup</label>
        <div className="tool-actions">
          <input
            className="tool-input"
            id={id}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cache during an outage"
          />
          <button
            disabled={!name.trim() || entries.length >= 8}
            onClick={() => {
              save([
                ...entries,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  scenario: { ...scenario },
                },
              ]);
              setName("");
            }}
          >
            Save experiment
          </button>
        </div>
        <p role="status">{message}</p>
        {entries.length === 0 ? (
          <p>No saved experiments yet.</p>
        ) : (
          <ul className="saved-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.name}</strong>
                <span>
                  {entry.scenario.requestsPerSecond} req/s ·{" "}
                  {entry.scenario.database}
                </span>
                <div className="tool-actions">
                  <button
                    onClick={() => onSelect({ ...entry.scenario })}
                    aria-label={`Load ${entry.name}`}
                  >
                    Load
                  </button>
                  <button
                    onClick={() =>
                      save(entries.filter((item) => item.id !== entry.id))
                    }
                    aria-label={`Remove ${entry.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
