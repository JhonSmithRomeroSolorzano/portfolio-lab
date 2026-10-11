import { useState } from "react";
import {
  TREE,
  gardenOrder,
  type Walk,
} from "../../../domain/playground/algorithm-garden";

export function AlgorithmGarden() {
  const [mode, setMode] = useState<Walk>("breadth");
  const [visited, setVisited] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [message, setMessage] = useState("Start at A. Which node comes next?");
  const order = gardenOrder(mode);
  const complete = visited.length === order.length;
  function reset(next = mode) {
    setMode(next);
    setVisited([]);
    setHint(false);
    setMessage("Start at A. Which node comes next?");
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
        <span className="play-kicker">04 / FOLLOW YOUR CURIOSITY</span>
        <h3 id="garden-title">
          A little order.
          <br />
          <em>A lot of possibility.</em>
        </h3>
        <p>
          Light up the tree, one node at a time. Two ways to explore the same
          world. Can you find the next step?
        </p>
        <div className="garden-modes" role="group" aria-label="Traversal style">
          <button
            aria-pressed={mode === "breadth"}
            onClick={() => reset("breadth")}
          >
            <strong>Across the rows</strong>
            <span>Breadth-first</span>
          </button>
          <button
            aria-pressed={mode === "depth"}
            onClick={() => reset("depth")}
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
          <span>{visited.length} / 7 LIT</span>
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
            {TREE.filter((node) => node.parent).map((node) => {
              const parent = TREE.find((parent) => parent.id === node.parent)!;
              return (
                <path
                  key={node.id}
                  className={visited.includes(node.id) ? "is-lit" : ""}
                  d={`M${parent.x} ${parent.y} C${parent.x} ${node.y - 16} ${node.x} ${parent.y + 16} ${node.x} ${node.y}`}
                />
              );
            })}
          </svg>
          {TREE.map((node) => (
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
        <p className="garden-feedback" role="status" aria-atomic="true">
          {message}
        </p>
      </div>
    </div>
  );
}
