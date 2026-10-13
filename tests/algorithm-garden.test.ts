import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TREE,
  GARDENS,
  gardenOrder,
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
