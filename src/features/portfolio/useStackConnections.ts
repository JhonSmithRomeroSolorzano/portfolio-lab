import { useEffect, useRef, useState } from "react";

/** Connect to actual card edges, including after text zoom and reflow. */
export function useStackConnections() {
  const topology = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState({
    viewBox: "0 0 100 100",
    request: "M25 25H75",
    query: "M75 25H50V75H25",
    result: "M25 75H50V25H75",
    response: "M75 25H25",
    hosting: "M75 25V75H25",
  });
  useEffect(() => {
    const element = topology.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const nodes = element.querySelectorAll<HTMLButtonElement>(".stack-node");
      if (nodes.length !== 4 || !bounds.width || !bounds.height) return;
      const [frontend, backend, data, infrastructure] = Array.from(
        nodes,
        (node) => {
          const rect = node.getBoundingClientRect();
          return {
            left: rect.left - bounds.left,
            right: rect.right - bounds.left,
            top: rect.top - bounds.top,
            bottom: rect.bottom - bounds.top,
            x: rect.left + rect.width / 2 - bounds.left,
            y: rect.top + rect.height / 2 - bounds.top,
          };
        },
      );
      const middle = (frontend.right + backend.left) / 2;
      setConnections({
        viewBox: `0 0 ${bounds.width} ${bounds.height}`,
        request: `M${frontend.right} ${frontend.y}H${backend.left}`,
        query: `M${backend.left} ${backend.y}H${middle}V${data.y}H${data.right}`,
        result: `M${data.right} ${data.y}H${middle}V${backend.y}H${backend.left}`,
        response: `M${backend.left} ${backend.y}H${frontend.right}`,
        hosting: `M${backend.x} ${backend.bottom}V${infrastructure.top}M${data.right} ${data.y}H${infrastructure.left}`,
      });
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  return { topology, connections };
}
