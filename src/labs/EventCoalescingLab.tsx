import { useState } from "react";
import { ToolPanel } from "../ToolPanel";
import { LabRange, LabChoice } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { coalesceInputs } from "./event-coalescing";
import type { CoalescingPolicy, InputPattern } from "./event-coalescing";
export function EventCoalescingLab() {
  const [pattern, setPattern] = useState<InputPattern>("burst"),
    [delay, setDelay] = useState(200),
    [policy, setPolicy] = useState<CoalescingPolicy>("debounce");
  const run = coalesceInputs(pattern, delay, policy);
  return (
    <ToolPanel title="How often should the interface react?">
      <div className="tool-content">
        <p>
          Typing and pointer input can arrive faster than expensive work should
          run. Compare every event, trailing debounce, and leading throttle on
          the same input stream.
        </p>
        <div className="lab-fields">
          <LabChoice
            label="Input pattern"
            value={pattern}
            options={[
              { value: "burst", label: "Bursty typing" },
              { value: "steady", label: "Steady pointer input" },
            ]}
            onChange={setPattern}
          />
          <LabRange
            label="Quiet period / throttle interval"
            value={delay}
            min={50}
            max={500}
            step={50}
            unit=" ms"
            onChange={setDelay}
          />
          <LabChoice
            label="Event policy"
            value={policy}
            options={[
              { value: "every", label: "Every event" },
              { value: "debounce", label: "Trailing debounce" },
              { value: "throttle", label: "Leading throttle" },
            ]}
            onChange={setPolicy}
          />
        </div>
        <div className="lab-outcome">
          <span>Work emitted</span>
          <strong>
            {run.emissions.length} / {run.input.length} events
          </strong>
          <p>
            {run.finalInputDelivered
              ? "The final input reaches the handler."
              : "The final input is dropped by leading-only throttle."}{" "}
            {run.omitted} inputs coalesced or dropped.
          </p>
        </div>
        <div className="policy-comparison">
          {(["every", "debounce", "throttle"] as const).map((p) => (
            <div key={p}>
              <span>{p}</span>
              <strong>
                {coalesceInputs(pattern, delay, p).emissions.length} calls
              </strong>
            </div>
          ))}
        </div>
        <EventInspector
          events={run.emissions.map((e) => ({
            at: e.at,
            title: `Input ${e.index + 1} delivered`,
            detail: `Input arrived at ${e.inputAt} ms and waited ${e.at - e.inputAt} ms before the handler.`,
            tone: "good",
          }))}
        />
        <p className="lab-assumptions">
          Finite deterministic input stream; no actual requests. Debounce
          flushes at its deadline before an equal-time input. Throttle emits
          only a leading event and has no trailing flush. Handler work is
          instantaneous.
        </p>
      </div>
    </ToolPanel>
  );
}
