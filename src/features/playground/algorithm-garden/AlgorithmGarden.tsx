import { useState } from "react";
import {
  GARDENS,
  gardenSteps,
  type Walk,
} from "../../../domain/playground/algorithm-garden";

export function AlgorithmGarden() {
  const [shape, setShape] = useState(0);
  const tree = GARDENS[shape].nodes;
  const [mode, setMode] = useState<Walk>("breadth");
  const [visited, setVisited] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [message, setMessage] = useState("Start at A. Which node comes next?");
  const steps = gardenSteps(mode, tree);
  const order = steps.at(-1)!.visited;
  const step = steps[visited.length];
  const complete = visited.length === order.length;
  function reset(next = mode) {
    setMode(next);
    setVisited([]);
    setHint(false);
    setMessage("Start at A. Which node comes next?");
  }
  function chooseMode(next: Walk) {
    if (next !== mode) reset(next);
  }
  function visit(id: string) {
    if (complete || visited.includes(id)) return;
    if (id !== order[visited.length]) {
      setMessage(
        mode === "breadth"
          ? `${id} can wait. Finish this row from left to right before moving down.`
          : `${id} can wait. Follow the left branch to its end, then come back for its sibling.`,
      );
      return;
    }
    const next = [...visited, id];
    setVisited(next);
    setHint(false);
    setMessage(
      next.length === order.length
        ? `Garden complete! ${mode === "breadth" ? "Breadth-first explores one level at a time." : "Depth-first follows a branch before visiting its neighbors."}`
        : `${id} is lit. ${next.length} of ${order.length} nodes visited. Keep going.`,
    );
  }
  return (
    <div className="algorithm-garden">
      <div className="garden-intro">
        <span className="play-kicker">07 / FOLLOW YOUR CURIOSITY</span>
        <h3 id="garden-title">
          A little order.
          <br />
          <em>A lot of possibility.</em>
        </h3>
        <p>
          Light up the tree, one node at a time. Two ways to explore the same
          world. Can you find the next step?
        </p>
        <div className="garden-shapes" role="group" aria-label="Choose a tree">
          {GARDENS.map((garden, index) => (
            <button
              key={garden.name}
              aria-pressed={shape === index}
              onClick={() => {
                if (shape !== index) {
                  setShape(index);
                  reset();
                }
              }}
            >
              {garden.name}
            </button>
          ))}
        </div>
        <div className="garden-modes" role="group" aria-label="Traversal style">
          <button
            aria-pressed={mode === "breadth"}
            onClick={() => chooseMode("breadth")}
          >
            <strong>Across the rows</strong>
            <span>Breadth-first</span>
          </button>
          <button
            aria-pressed={mode === "depth"}
            onClick={() => chooseMode("depth")}
          >
            <strong>Down the branches</strong>
            <span>Depth-first</span>
          </button>
        </div>
        <p className="garden-rule" id="garden-rule">
          {mode === "breadth"
            ? "Go row by row, from left to right. Finish each level before moving deeper."
            : "Visit the root, then follow each branch all the way down, left before right. This is pre-order traversal."}
        </p>
        <div className="play-actions">
          <button onClick={() => reset()}>Reset garden</button>
          <button
            disabled={complete}
            onClick={() => {
              setHint(true);
              setMessage(`Try ${order[visited.length]} next.`);
            }}
          >
            Hint the next node
          </button>
        </div>
      </div>
      <div className="garden-workspace">
        <div className="garden-caption">
          <span>ALGORITHM GARDEN</span>
          <span>
            {visited.length} / {tree.length} LIT
          </span>
        </div>
        <div
          className={`garden-tree ${complete ? "is-complete" : ""}`}
          role="group"
          aria-label="Light up the tree"
          aria-describedby="garden-rule"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {tree
              .filter((node) => node.parent)
              .map((node) => {
                const parent = tree.find(
                  (parent) => parent.id === node.parent,
                )!;
                return (
                  <path
                    key={node.id}
                    className={visited.includes(node.id) ? "is-lit" : ""}
                    d={`M${parent.x} ${parent.y} C${parent.x} ${node.y - 16} ${node.x} ${parent.y + 16} ${node.x} ${node.y}`}
                  />
                );
              })}
          </svg>
          {tree.map((node) => (
            <button
              key={node.id}
              className={`garden-node ${visited.includes(node.id) ? "is-lit" : ""} ${hint && order[visited.length] === node.id ? "is-hinted" : ""}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-label={`Node ${node.id}${visited.includes(node.id) ? `, visited ${visited.indexOf(node.id) + 1}` : ""}`}
              aria-disabled={visited.includes(node.id)}
              onClick={() => visit(node.id)}
            >
              {node.id}
              {visited.includes(node.id) && (
                <small aria-hidden="true">{visited.indexOf(node.id) + 1}</small>
              )}
            </button>
          ))}
        </div>
        <div className="garden-trail" aria-label="Your traversal">
          {order.map((_, i) => (
            <span key={i}>{visited[i] || "·"}</span>
          ))}
        </div>
        <details className="garden-reasoning">
          <summary>See how this traversal works</summary>
          <p>
            {mode === "breadth"
              ? "A queue takes the oldest waiting node first. Children join the back."
              : "A stack takes the newest waiting node first. Push right before left so the left child is visited next."}
          </p>
          <strong>
            {mode === "breadth" ? "Queue · front first" : "Stack · top first"}
          </strong>
          <ol
            aria-label={
              mode === "breadth" ? "Queue, front first" : "Stack, top first"
            }
          >
            {step.pending.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ol>
          <p className="garden-step">
            {!step.current
              ? "A is waiting. Visit it to add its children."
              : `${step.current} visited. ${step.added.length ? `${step.added.join(", ")} added ${mode === "breadth" ? "to the back" : "on top, left child first"}.` : "No children to add."} ${step.pending.length ? `${step.pending[0]} is next.` : "Nothing waiting. Traversal complete."}`}
          </p>
        </details>
        <p className="garden-feedback" role="status" aria-atomic="true">
          {message}
        </p>
      </div>
    </div>
  );
}
