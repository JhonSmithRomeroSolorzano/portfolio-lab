import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(
  /<script id="navigation-bootstrap">([\s\S]*?)<\/script>/,
)![1];

function bootstrap(ready = false) {
  const listeners = new Map<string, (event: unknown) => void>();
  const root = {
    dataset: {} as Record<string, string>,
    removeAttribute(name: string) {
      assert.equal(name, "data-navigation");
      delete this.dataset.navigation;
    },
  };
  class ScriptElement {
    constructor(public type: string) {}
  }
  class ScriptError {}
  runInNewContext(script, {
    HTMLScriptElement: ScriptElement,
    ErrorEvent: ScriptError,
    document: {
      documentElement: root,
      querySelector: () => ({ dataset: { menuReady: String(ready) } }),
    },
    window: {
      addEventListener(type: string, listener: (event: unknown) => void) {
        listeners.set(type, listener);
      },
      removeEventListener(type: string, listener: (event: unknown) => void) {
        assert.equal(listeners.get(type), listener);
        listeners.delete(type);
      },
    },
  });
  return { listeners, root, ScriptElement, ScriptError };
}

test("navigation bootstrap restores links for startup exceptions and failed modules", () => {
  for (const failure of ["exception", "module"]) {
    const state = bootstrap();
    assert.equal(state.root.dataset.navigation, "pending");
    state.listeners.get("error")!(
      failure === "exception"
        ? new state.ScriptError()
        : { target: new state.ScriptElement("module") },
    );
    assert.equal(state.root.dataset.navigation, undefined);
  }
});

test("navigation bootstrap ignores unrelated resource failures and hydrated menus", () => {
  const pending = bootstrap();
  pending.listeners.get("error")!({ target: {} });
  pending.listeners.get("error")!({
    target: new pending.ScriptElement("text/plain"),
  });
  assert.equal(pending.root.dataset.navigation, "pending");
  const healthy = bootstrap(true);
  healthy.listeners.get("error")!(new healthy.ScriptError());
  assert.equal(healthy.root.dataset.navigation, "pending");
});

test("navigation bootstrap releases its error listener at window load", () => {
  const state = bootstrap();
  state.listeners.get("load")!({});
  assert.equal(state.listeners.has("error"), false);
});
