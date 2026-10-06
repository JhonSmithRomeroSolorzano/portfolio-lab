import { useEffect, useState } from "react";
import { parseRequestRate } from "./request-rate";
export function RequestRateInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const invalid = parseRequestRate(draft) === null;
  return (
    <div className="exact-rate">
      <label htmlFor="exact-traffic">Exact request rate</label>
      <input
        id="exact-traffic"
        type="number"
        inputMode="numeric"
        min="1"
        max="600"
        step="1"
        value={draft}
        aria-invalid={invalid}
        aria-describedby="rate-help"
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = parseRequestRate(raw);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => {
          if (invalid) setDraft(String(value));
        }}
      />
      <small id="rate-help">
        {invalid
          ? "Enter a whole number from 1 to 600. The last valid rate is still active."
          : "1–600 req/s. Type an exact boundary to test it."}
      </small>
    </div>
  );
}
