import { useState } from "react";

const layers = [
  {
    id: "interface",
    name: "Interface",
    caption: "What people use",
    title: "The interface is part of the system.",
    description:
      "I build frontend features with React and Material UI, working with JavaScript and TypeScript to connect the UI to the services behind it.",
    tools: ["React", "Material UI", "JavaScript", "TypeScript"],
    destination: "#about",
    action: "More about my work",
  },
  {
    id: "services",
    name: "Services",
    caption: "How it connects",
    title: "Follow the request beyond the screen.",
    description:
      "I build backend services with Node.js and Express, connecting interfaces to data and application logic. My experience also includes Redis caching and WebSocket communication.",
    tools: ["Node.js", "Express", "Redis", "WebSockets"],
    destination: "#lab",
    action: "Open Signal Lab",
  },
  {
    id: "data",
    name: "Data",
    caption: "NoSQL + SQL",
    title: "Strongest in NoSQL. Experienced in SQL.",
    description:
      "NoSQL databases are my strongest area of database experience. I also work with SQL databases, connecting both to backend services and the interfaces that use them.",
    tools: ["NoSQL", "SQL"],
    destination: "#resume",
    action: "Read my experience",
  },
] as const;

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
      {kind === "interface" ? (
        <>
          <rect x="3" y="4" width="22" height="19" rx="2" />
          <path d="M3 10h22M7 7h1m2 0h1M8 14l-3 3 3 3m12-6 3 3-3 3m-5-6-2 6" />
        </>
      ) : kind === "services" ? (
        <>
          <rect x="4" y="4" width="20" height="8" rx="2" />
          <rect x="4" y="16" width="20" height="8" rx="2" />
          <path d="M8 8h1m3 0h8M8 20h1m3 0h8M14 12v4" />
        </>
      ) : (
        <>
          <ellipse cx="14" cy="6" rx="10" ry="4" />
          <path d="M4 6v15c0 5.3 20 5.3 20 0V6M4 13c0 5.3 20 5.3 20 0" />
        </>
      )}
    </svg>
  );
}

export function StackMap() {
  const [selected, setSelected] =
    useState<(typeof layers)[number]["id"]>("interface");
  const layer = layers.find((item) => item.id === selected)!;
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
          <path
            className="map-wire"
            d="M140 140H280V250H400M400 250H530V140H660"
          />
          <path className="map-wire-secondary" d="M140 140V325H660V140" />
          <circle cx="280" cy="250" r="4" />
          <circle cx="530" cy="140" r="4" />
        </svg>
        {layers.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`stack-node stack-node-${item.id}`}
            aria-label={`Explore ${item.name.toLowerCase()} experience`}
            aria-pressed={selected === item.id}
            aria-controls="stack-detail"
            onClick={() => setSelected(item.id)}
          >
            <LayerIcon kind={item.id} />
            <strong>{item.name}</strong>
            <span>{item.caption}</span>
          </button>
        ))}
        <p className="map-footnote">Frontend ↔ backend ↔ data</p>
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
        <ul className="stack-tools" aria-label="Technologies">
          {layer.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
        <a href={layer.destination}>
          {layer.action} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
