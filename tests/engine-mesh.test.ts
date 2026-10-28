import assert from "node:assert/strict";
import test from "node:test";
import { engineFaces } from "../src/features/playground/jet-engine/mesh";
import { referenceEngineFaces } from "./helpers/engine-mesh-reference";

test("cached hub construction preserves all original faces, topology, shade and stable ordering", () => {
  const first = engineFaces(0, 0),
    copy = structuredClone(first);
  let reused = 0;
  for (const deployment of [0, 0.25, 0.5, 1, 0.75, 0])
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 108;
      const actual = engineFaces(angle, deployment);
      assert.deepEqual(actual, referenceEngineFaces(angle, deployment));
      reused += actual.filter((face) => first.includes(face)).length;
      assert.deepEqual(first, copy);
      assert.notEqual(actual, first);
    }
  assert.ok(
    reused > 0,
    "fixed hub records should be shared rather than reconstructed",
  );
});
