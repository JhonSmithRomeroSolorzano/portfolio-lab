import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  MOTION_CHANGE,
  MOTION_KEY,
  currentMotionPreference,
  motionPreference,
  motionQuery,
  resolvedMotion,
  setMotionPreference,
} from "../src/shared/motion/motion-preference.ts";

function fixture() {
  const root = { dataset: {} as Record<string, string> };
  const values = new Map<string, string>();
  let denied = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (denied) throw new Error("Storage denied");
      values.set(key, value);
    },
  };
  const device = Object.assign(new EventTarget(), { matches: false });
  const view = Object.assign(new EventTarget(), {
    document: { documentElement: root },
    matchMedia: () => device,
    localStorage: storage,
  }) as unknown as Window;
  return {
    view,
    root,
    values,
    device,
    deny: () => {
      denied = true;
    },
    external: (key: string | null, newValue: string | null, area?: object) =>
      view.dispatchEvent(
        Object.assign(new Event("storage"), {
          key,
          newValue,
          storageArea: area,
        }),
      ),
  };
}

test("site motion can reduce animation but never override a device reduction", () => {
  for (const value of [null, "system", "full", "", "invalid"])
    assert.equal(motionPreference(value), "system");
  assert.equal(motionPreference("reduce"), "reduce");
  assert.equal(resolvedMotion("system", false), false);
  assert.equal(resolvedMotion("system", true), true);
  assert.equal(resolvedMotion("reduce", false), true);
  assert.equal(resolvedMotion("reduce", true), true);
});

test("one motion policy notifies React and imperative observers and releases subscriptions", () => {
  const f = fixture();
  const first = motionQuery(f.view),
    second = motionQuery(f.view);
  let calls = 0;
  const change = () => {
    calls++;
  };
  first.addEventListener("change", change);
  first.addEventListener("change", change);
  second.addEventListener("change", change);
  assert.equal(setMotionPreference("reduce", f.view), true);
  assert.equal(f.values.get(MOTION_KEY), "reduce");
  assert.equal(first.matches, true);
  assert.equal(second.matches, true);
  assert.equal(f.root.dataset.motion, "reduce");
  assert.equal(calls, 2);
  setMotionPreference("system", f.view);
  assert.equal(first.matches, false);
  f.device.matches = true;
  f.device.dispatchEvent(new Event("change"));
  assert.equal(first.matches, true);
  assert.equal(f.root.dataset.motion, "reduce");
  first.removeEventListener("change", change);
  second.removeEventListener("change", change);
  const stopped = calls;
  f.device.matches = false;
  f.device.dispatchEvent(new Event("change"));
  f.view.dispatchEvent(new Event(MOTION_CHANGE));
  f.external(MOTION_KEY, "reduce");
  assert.equal(calls, stopped);
});

test("tab synchronization validates changes and denied storage retains the visit's choice", () => {
  const f = fixture();
  const source = motionQuery(f.view);
  let calls = 0;
  const change = () => {
    calls++;
  };
  source.addEventListener("change", change);
  f.external("portfolio-theme", "dark");
  f.external(MOTION_KEY, "reduce", {});
  assert.equal(calls, 0);
  f.external(MOTION_KEY, "reduce");
  assert.equal(source.matches, true);
  f.external(MOTION_KEY, "invalid");
  assert.equal(source.matches, false);
  f.external(MOTION_KEY, "reduce");
  f.external(null, null);
  assert.equal(source.matches, false);
  f.deny();
  assert.equal(setMotionPreference("reduce", f.view), false);
  assert.equal(source.matches, true);
  assert.equal(
    currentMotionPreference(f.root as unknown as HTMLElement),
    "reduce",
  );
  source.removeEventListener("change", change);
});

test("pre-paint motion bootstrap agrees with device, saved, corrupt, and unavailable storage", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const script = html.match(
    /<script id="motion-bootstrap">([\s\S]*?)<\/script>/,
  )![1];
  for (const value of [null, "system", "reduce", "invalid", "denied"]) {
    for (const device of [false, true]) {
      const root = { dataset: {} as Record<string, string> };
      runInNewContext(script, {
        document: { documentElement: root },
        localStorage: {
          getItem: (key: string) => {
            assert.equal(key, MOTION_KEY);
            if (value === "denied") throw new Error("Denied");
            return value;
          },
        },
        matchMedia: () => ({ matches: device }),
      });
      assert.equal(root.dataset.motionPreference, motionPreference(value));
      assert.equal(
        root.dataset.motion,
        resolvedMotion(motionPreference(value), device) ? "reduce" : "full",
      );
    }
  }
});
