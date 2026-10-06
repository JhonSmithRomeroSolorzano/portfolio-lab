import { useState } from "react";
import { availableRoutes, requestTrace } from "./request-trace";
import type { TraceRoute } from "./request-trace";
import type { Scenario } from "./simulation";
export function RequestTrace({ scenario }: { scenario: Scenario }) {
  const routes = availableRoutes(scenario);
  const [route, setRoute] = useState<TraceRoute>(routes[0]);
  const [count, setCount] = useState(1);
  const steps = requestTrace(scenario, route);
  return (
    <details className="tool-panel">
      <summary>Follow one request</summary>
      <div className="tool-content">
        <p>
          A step-by-step illustration of an available outcome. This is a modeled
          path, not a live network trace.
        </p>
        <div className="tool-actions" role="group" aria-label="Request outcome">
          {routes.map((r) => (
            <button
              key={r}
              aria-pressed={r === route}
              onClick={() => {
                setRoute(r);
                setCount(1);
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <ol className="trace-list" aria-live="polite">
          {steps.slice(0, count).map((step, i) => (
            <li key={i}>
              <code>{step.at} ms</code> {step.label}
            </li>
          ))}
        </ol>
        <div className="tool-actions">
          <button
            disabled={count === steps.length}
            onClick={() => setCount((c) => c + 1)}
          >
            Next step
          </button>
          <button onClick={() => setCount(1)}>Restart trace</button>
        </div>
      </div>
    </details>
  );
}
