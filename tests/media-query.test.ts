import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useMediaQuery } from "../src/shared/hooks/useMediaQuery";

test("media-query server snapshots stay false without accessing browser globals", (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get() {
      throw new Error("Server rendering must not access window");
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
  function Probe({ query }: { query: string }) {
    return createElement("output", null, String(useMediaQuery(query)));
  }
  for (const query of ["(prefers-color-scheme: dark)", "(min-width: 600px)"])
    assert.equal(
      renderToString(createElement(Probe, { query })),
      "<output>false</output>",
    );
});
