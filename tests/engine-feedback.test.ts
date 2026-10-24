import assert from "node:assert/strict";
import test from "node:test";
import { engineFeedback } from "../src/features/playground/jet-engine/feedback";

const ready = {
  speed: 60,
  mode: "forward" as const,
  available: true,
  artFailed: false,
  artReady: true,
  reduced: false,
  running: true,
};

test("engine feedback prioritizes artwork failure, loading, and zero speed over motion", () => {
  assert.match(
    engineFeedback({ ...ready, artFailed: true, artReady: false, speed: 0 }),
    /^Engine paused until its artwork can be reloaded\./,
  );
  assert.match(
    engineFeedback({ ...ready, artReady: false, speed: 0 }),
    /^Loading engine casing artwork…/,
  );
  assert.match(
    engineFeedback({ ...ready, speed: 0, reduced: true, available: false }),
    /^Engine off\./,
  );
});

test("engine feedback distinguishes reduced motion, preparation, SVG fallback, and manual pause", () => {
  assert.match(
    engineFeedback({ ...ready, reduced: true, available: false }),
    /^Static view at 60%\. Reduced motion is on/,
  );
  assert.match(
    engineFeedback({ ...ready, available: undefined }),
    /^Preparing engine animation…/,
  );
  assert.match(
    engineFeedback({ ...ready, available: false }),
    /^Static SVG view at 60%\. Canvas animation is unavailable/,
  );
  assert.match(engineFeedback(ready), /^Running at a 60% setting\./);
  assert.match(
    engineFeedback({ ...ready, running: false }),
    /^Paused at 60%\./,
  );
});

test("engine feedback describes reverse selection without implying negative rotor speed or mutating settings", () => {
  const settings = Object.freeze({
    ...ready,
    mode: "reverse" as const,
    running: false,
  });
  assert.match(engineFeedback(settings), /^Paused at 60%\./);
  assert.match(
    engineFeedback(settings),
    /Reverse thrust selected\..*engine rotation does not reverse\.$/,
  );
  assert.match(engineFeedback(ready), /Forward thrust selected\.$/);
  assert.equal(settings.speed, 60);
  assert.equal(settings.running, false);
});
