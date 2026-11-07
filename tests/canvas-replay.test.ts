import assert from "node:assert/strict";
import test from "node:test";
import { drawingInputs, type CanvasFrame } from "../e2e/helpers/canvas-replay";

function frame(method: "stroke" | "fill" | "fillText" = "stroke"): CanvasFrame {
  return {
    width: 318,
    height: 318,
    theme: "light",
    commands: [
      {
        method,
        args: method === "fillText" ? ["1", 124, 147] : [],
        state: {
          transform: [1, 0, 0, 1, 0, 0],
          values: {
            strokeStyle: "#975014",
            fillStyle: "#000000",
            font: "10px sans-serif",
            lineWidth: 5,
            lineCap: "round",
            lineJoin: "round",
            globalAlpha: 0.025,
          },
          lineDash: [],
        },
      },
    ],
  };
}

test("canvas replay fingerprints ignore unused stroke state without changing raw evidence", () => {
  const before = frame();
  const after = structuredClone(before);
  after.commands[0].state!.values.fillStyle = "#ffcc8a";
  after.commands[0].state!.values.font = "11px monospace";
  assert.deepEqual(drawingInputs(before), drawingInputs(after));
  assert.notDeepEqual(before, after);
  assert.equal(after.commands[0].state!.values.fillStyle, "#ffcc8a");
});

test("canvas replay fingerprints retain geometry, stroke paint, fill paint and text inputs", () => {
  for (const change of [
    (value: CanvasFrame) => {
      value.commands[0].args = [1];
    },
    (value: CanvasFrame) => {
      value.commands[0].state!.transform[0] = 2;
    },
    (value: CanvasFrame) => {
      value.commands[0].state!.lineDash = [2, 3];
    },
    ...["strokeStyle", "lineWidth", "lineCap", "lineJoin", "globalAlpha"].map(
      (key) => (value: CanvasFrame) => {
        value.commands[0].state!.values[key] = "different";
      },
    ),
  ]) {
    const before = frame();
    const after = structuredClone(before);
    change(after);
    assert.notDeepEqual(drawingInputs(before), drawingInputs(after));
  }
  for (const [method, key] of [
    ["fill", "fillStyle"],
    ["fillText", "font"],
  ] as const) {
    const before = frame(method);
    const after = structuredClone(before);
    after.commands[0].state!.values[key] = "different";
    assert.notDeepEqual(drawingInputs(before), drawingInputs(after));
  }
});
