import { createRoot } from "react-dom/client";
import { ExperimentBoundary } from "../../src/features/playground/ExperimentBoundary";
import { SignalSculpture } from "../../src/features/playground/signal-sculpture/SignalSculpture";

export type CanvasStartupWindow = typeof window & {
  canvasStartup: { mount(): void; unmount(): void; recover(): void };
};

const root = createRoot(document.getElementById("probe-root")!);
let fail = true;
const clear = CanvasRenderingContext2D.prototype.clearRect;
CanvasRenderingContext2D.prototype.clearRect = function (...args) {
  if (fail && this.canvas.closest(".sculpture-stage"))
    throw new Error("Controlled first-paint failure");
  return clear.apply(this, args);
};

(window as CanvasStartupWindow).canvasStartup = {
  mount() {
    root.render(
      <ExperimentBoundary title="Signal Sculpture">
        <SignalSculpture />
      </ExperimentBoundary>,
    );
  },
  unmount() {
    root.unmount();
    CanvasRenderingContext2D.prototype.clearRect = clear;
  },
  recover() {
    fail = false;
  },
};
