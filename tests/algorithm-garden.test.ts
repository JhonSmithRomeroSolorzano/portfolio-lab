import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TREE,
  GARDENS,
  gardenOrder,
  gardenSteps,
} from "../src/domain/playground/algorithm-garden";

test("garden traversals visit every node once, preserve parent precedence and differ meaningfully", () => {
  assert.deepEqual(gardenOrder("breadth"), ["A", "B", "C", "D", "E", "F", "G"]);
  assert.deepEqual(gardenOrder("depth"), ["A", "B", "D", "E", "C", "F", "G"]);
  for (const mode of ["breadth", "depth"] as const) {
    const order = gardenOrder(mode);
    assert.equal(new Set(order).size, TREE.length);
    for (const node of TREE)
      if (node.parent)
        assert.ok(order.indexOf(node.parent) < order.indexOf(node.id));
  }
});

test("each authored garden is connected, has unique nodes, and offers a distinct traversal", () => {
  for (const garden of GARDENS) {
    assert.equal(
      new Set(garden.nodes.map((node) => node.id)).size,
      garden.nodes.length,
    );
    assert.equal(garden.nodes.filter((node) => !node.parent).length, 1);
    for (const mode of ["breadth", "depth"] as const) {
      const order = gardenOrder(mode, garden.nodes);
      assert.equal(order.length, garden.nodes.length);
      assert.equal(new Set(order).size, order.length);
      for (const node of garden.nodes)
        if (node.parent)
          assert.ok(order.indexOf(node.parent) < order.indexOf(node.id));
    }
  }
  assert.deepEqual(gardenOrder("depth", GARDENS[1].nodes), [
    "A",
    "B",
    "D",
    "F",
    "G",
    "E",
    "C",
  ]);
  assert.deepEqual(gardenOrder("breadth", GARDENS[2].nodes), [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ]);
});

test("frontier snapshots explain queue versus stack without exposing a contradictory next move", () => {
  const breadth = gardenSteps("breadth");
  const depth = gardenSteps("depth");
  assert.deepEqual(breadth[2].pending, ["C", "D", "E"]);
  assert.deepEqual(depth[2].pending, ["D", "E", "C"]);
  for (const garden of GARDENS)
    for (const mode of ["breadth", "depth"] as const) {
      const steps = gardenSteps(mode, garden.nodes);
      const order = gardenOrder(mode, garden.nodes);
      for (let i = 0; i < order.length; i++) {
        assert.equal(steps[i].pending[0], order[i]);
        assert.deepEqual(steps[i].visited, order.slice(0, i));
        assert.ok(
          steps[i].pending.every((id) => !steps[i].visited.includes(id)),
        );
      }
      assert.deepEqual(steps.at(-1)!.pending, []);
    }
});
