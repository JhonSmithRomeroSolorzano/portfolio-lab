import { LibraryFiles } from "./LibraryFiles";
import { mergeLibrary } from "./library-file";
import { useEffect, useId, useRef, useState } from "react";
import {
  LIBRARY_KEY,
  loadLibrary,
  restoreExperiment,
  renameExperiment,
  updateExperiment,
} from "./experiment-library";
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
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const [name, setName] = useState("");
  const [removed, setRemoved] = useState<{
    entry: SavedExperiment;
    index: number;
  } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (removed) undoRef.current?.focus();
  }, [removed]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
            ref={nameRef}
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
        <LibraryFiles
          entries={entries}
          onImport={(incoming) =>
            save(mergeLibrary(entriesRef.current, incoming))
          }
        />
        {removed && (
          <div className="tool-actions">
            <span>Removed {removed.entry.name}.</span>
            <button
              ref={undoRef}
              disabled={entries.length >= 8}
              onClick={() => {
                try {
                  save(
                    restoreExperiment(entries, removed.entry, removed.index),
                  );
                  setRemoved(null);
                  nameRef.current?.focus();
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Could not restore this experiment.",
                  );
                }
              }}
            >
              Undo last removal
            </button>
            {entries.length >= 8 && <span>Make room to restore it.</span>}
          </div>
        )}
        {entries.length === 0 ? (
          <p>No saved experiments yet.</p>
        ) : (
          <ul className="saved-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                {editing === entry.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      try {
                        save(renameExperiment(entries, entry.id, editName));
                        setEditing(null);
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Could not rename this experiment.",
                        );
                      }
                    }}
                  >
                    <label htmlFor={`${id}-${entry.id}`}>
                      New name for {entry.name}
                    </label>
                    <input
                      id={`${id}-${entry.id}`}
                      className="tool-input"
                      value={editName}
                      maxLength={40}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <div className="tool-actions">
                      <button type="submit" disabled={!editName.trim()}>
                        Save name
                      </button>
                      <button type="button" onClick={() => setEditing(null)}>
                        Cancel rename
                      </button>
                    </div>
                  </form>
                ) : (
                  <strong>{entry.name}</strong>
                )}
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
                    onClick={() => {
                      setEditing(entry.id);
                      setEditName(entry.name);
                    }}
                    aria-label={`Rename ${entry.name}`}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      save(updateExperiment(entries, entry.id, scenario));
                      setMessage(
                        `${entry.name} updated with the current setup.`,
                      );
                    }}
                    aria-label={`Update ${entry.name} with current setup`}
                  >
                    Update setup
                  </button>
                  <button
                    onClick={() => {
                      setRemoved({
                        entry,
                        index: entries.findIndex(
                          (item) => item.id === entry.id,
                        ),
                      });
                      if (editing === entry.id) setEditing(null);
                      save(entries.filter((item) => item.id !== entry.id));
                    }}
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
