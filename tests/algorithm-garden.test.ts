import { test } from "node:test";
import assert from "node:assert/strict";
import { TREE, gardenOrder } from "../src/play/algorithm-garden";

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
