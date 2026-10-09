import { useState } from "react";

import { stackLayers } from "./technology-stack";

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
  const [selected, setSelected] =
    useState<(typeof stackLayers)[number]["id"]>("frontend");
  const layer = stackLayers.find((item) => item.id === selected)!;
  return (
    <div className="stack-map">
      <div className="stack-drawing" role="group" aria-label="Explore my stack">
        <div className="map-caption">
          <span>A MAP OF MY WORK</span>
          <span>
            Choose a layer <span aria-hidden="true">↙</span>
          </span>
        </div>
        <svg
          className="map-wires"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path className="map-wire" d="M200 120H600V280H200V120" />
          <path className="map-wire-secondary" d="M200 120H400V280H600" />
          <circle cx="400" cy="120" r="4" />
          <circle cx="400" cy="280" r="4" />
        </svg>
        {stackLayers.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`stack-node stack-node-${item.id}`}
            aria-pressed={selected === item.id}
            aria-controls="stack-detail"
            onClick={() => setSelected(item.id)}
          >
            <LayerIcon kind={item.id} />
            <strong>{item.name}</strong>
            <span>{item.caption}</span>
          </button>
        ))}
        <p className="map-footnote">
          Frontend · backend · data · infrastructure
        </p>
      </div>
      <div
        className="stack-detail"
        id="stack-detail"
        role="region"
        aria-label="Selected stack experience"
        aria-live="polite"
        aria-atomic="true"
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
    </div>
  );
}
