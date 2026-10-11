import { useEffect, useRef, useState } from "react";
import { LAB_AREAS } from "../lab-catalog";
import type { LabId } from "../lab-catalog";
import { findLabs } from "./find-labs";
import type { LabArea } from "./find-labs";
export function LabBrowser({
  active,
  onSelect,
}: {
  active: LabId;
  onSelect: (id: LabId) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [area, setArea] = useState<LabArea | "All">("All");
  const trigger = useRef<HTMLButtonElement>(null),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const results = findLabs(query, area);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      className="lab-browser"
      onKeyDown={(e) => {
        if (open && e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        className="browse-labs"
        aria-expanded={open}
        aria-controls="lab-browser-panel"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close lab browser" : "Browse experiments"}
      </button>
      {open && (
        <div id="lab-browser-panel" className="lab-browser-panel">
          <label htmlFor="lab-search">Find an experiment</label>
          <input
            id="lab-search"
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try cache, response, or retry"
          />
          <div
            className="lab-area-filters"
            aria-label="Filter experiments by area"
            role="group"
          >
            {(["All", ...LAB_AREAS] as const).map((value) => (
              <button
                key={value}
                aria-pressed={area === value}
                onClick={() => setArea(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <p role="status">
            {results.length}{" "}
            {results.length === 1 ? "experiment" : "experiments"} found
          </p>
          {results.length ? (
            <ul className="lab-browser-results">
              {results.map((lab) => (
                <li key={lab.id}>
                  <button
                    aria-current={active === lab.id ? "true" : undefined}
                    onClick={() => {
                      onSelect(lab.id);
                      setOpen(false);
                      document.getElementById("lab-picker")?.focus();
                    }}
                  >
                    <span>{lab.area}</span>
                    <strong>{lab.name}</strong>
                    <small>{lab.detail}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="lab-browser-empty">
              <p>No match. Try a broader term or another area.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setArea("All");
                  input.current?.focus();
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
