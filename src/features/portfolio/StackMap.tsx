import { useState } from "react";
import { useClientReady } from "../../shared/hooks/useClientReady";

import { stackLayers } from "./data/technology-stack";
import { stackFlowSteps, useStackFlow } from "./useStackFlow";
import { useStackConnections } from "./useStackConnections";

function LayerIcon({ kind }: { kind: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {kind === "frontend" ? (
        <>
          <rect x="3" y="4" width="22" height="19" rx="2" />
          <path d="M3 10h22M7 7h1m2 0h1M8 14l-3 3 3 3m12-6 3 3-3 3m-5-6-2 6" />
        </>
      ) : kind === "backend" ? (
        <>
          <rect x="4" y="4" width="20" height="8" rx="2" />
          <rect x="4" y="16" width="20" height="8" rx="2" />
          <path d="M8 8h1m3 0h8M8 20h1m3 0h8M14 12v4" />
        </>
      ) : kind === "data" ? (
        <>
          <ellipse cx="14" cy="6" rx="10" ry="4" />
          <path d="M4 6v15c0 5.3 20 5.3 20 0V6M4 13c0 5.3 20 5.3 20 0" />
        </>
      ) : (
        <>
          <path d="M7 18H6a4 4 0 0 1 0-8 7 7 0 0 1 13-2 5 5 0 0 1 2 10h-2" />
          <path d="M14 24V13m-4 4 4-4 4 4M9 25h10" />
        </>
      )}
    </svg>
  );
}

export function StackMap() {
  const ready = useClientReady();
  const [selected, setSelected] =
    useState<(typeof stackLayers)[number]["id"]>("frontend");
  const flow = useStackFlow();
  const { topology, connections } = useStackConnections();
  const current = stackFlowSteps[flow.step];
  return (
    <div className="stack-map">
      <div
        ref={flow.target}
        className="stack-drawing"
        role="group"
        aria-label="Explore my stack"
        data-playing={flow.playing}
        onFocusCapture={(event) =>
          flow.setKeyboardFocus(event.target.matches(":focus-visible"))
        }
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            flow.setKeyboardFocus(false);
        }}
      >
        <div className="map-caption">
          <span>A MAP OF MY WORK</span>
          <span>
            Choose a layer <span aria-hidden="true">↙</span>
          </span>
        </div>
        <div className="map-topology" data-step={flow.step} ref={topology}>
          <svg
            className="map-wires"
            viewBox={connections.viewBox}
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              className="map-wire"
              d={`${connections.request}${connections.query}`}
            />
            <path className="map-wire-secondary" d={connections.hosting} />
            <path
              key={`${flow.tour}-${flow.step}`}
              className="map-packet"
              pathLength="100"
              d={
                flow.step === 1
                  ? connections.request
                  : flow.step === 3
                    ? connections.query
                    : flow.step === 5
                      ? connections.result
                      : flow.step === 7
                        ? connections.response
                        : connections.request
              }
              data-visible={[1, 3, 5, 7].includes(flow.step)}
            />
          </svg>
          {stackLayers.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={!ready}
              className={`stack-node stack-node-${item.id}`}
              aria-pressed={selected === item.id}
              aria-controls="stack-detail"
              data-flow-active={current.node === item.id && !flow.reducedMotion}
              aria-describedby="stack-flow-description"
              onClick={() => setSelected(item.id)}
            >
              <LayerIcon kind={item.id} />
              <strong>{item.name}</strong>
              <span>{item.caption}</span>
              <span className="map-node-activity" aria-hidden="true">
                {item.id === "infrastructure"
                  ? "Hosting the flow"
                  : current.node === item.id
                    ? current.activity
                    : "Ready"}
              </span>
            </button>
          ))}
        </div>
        <p className="map-flow-readout" aria-hidden="true">
          <span className="map-flow-count">
            {flow.reducedMotion ? "FLOW" : `0${flow.step + 1} / 09`}
          </span>
          <span className="map-flow-labels">
            {stackFlowSteps.map((step, index) => (
              <span
                key={step.label}
                data-current={!flow.reducedMotion && flow.step === index}
              >
                {step.label}
              </span>
            ))}
            <span data-current={flow.reducedMotion}>
              Browser → API → data → browser
            </span>
          </span>
        </p>
        <p className="map-footnote" id="stack-flow-description">
          Illustrative request round trip · hosted on infrastructure. Not live
          traffic.
          <span className="sr-only">
            {" "}
            The browser sends a request to the backend, which validates it and
            queries data. Data returns a result, the backend builds a response,
            and the browser renders it. Infrastructure hosts the services.
          </span>
        </p>
      </div>
      <div
        className="stack-details"
        id="stack-detail"
        role="region"
        aria-label="Selected stack experience"
        aria-live="polite"
        aria-atomic="true"
      >
        {stackLayers.map((layer) => (
          <div
            key={layer.id}
            className="stack-detail"
            aria-hidden={selected !== layer.id}
            inert={selected !== layer.id}
          >
            <span className="stack-detail-label">{layer.name}</span>
            <h2>{layer.title}</h2>
            <p>{layer.description}</p>
            <dl className="stack-facts" aria-label="Technology categories">
              {layer.groups.map((group) => (
                <div key={group.label}>
                  <dt>{group.label}</dt>
                  <dd>{group.items.join(" · ")}</dd>
                </div>
              ))}
            </dl>
            <a href={layer.destination}>
              {layer.action} <span aria-hidden="true">↗</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
