import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  THEME_KEY,
  readTheme,
  resolvedTheme,
  saveTheme,
  themePreference,
} from "../src/theme-preference.ts";

// Exercise the actual pre-paint script, not a separately copied implementation.
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(
  /<script id="theme-bootstrap">([\s\S]*?)<\/script>/,
)![1];

test("pre-paint theme and interactive control agree for saved, missing, and corrupt preferences", () => {
  for (const saved of [null, "light", "dark", "system", "unexpected"]) {
    for (const systemDark of [true, false]) {
      const root = { dataset: {} as Record<string, string> };
      let chromeColor = "";
      runInNewContext(script, {
        localStorage: {
          getItem: (key: string) => {
            assert.equal(key, THEME_KEY);
            return saved;
          },
        },
        matchMedia: () => ({ matches: systemDark }),
        document: {
          documentElement: root,
          querySelector: () => ({
            setAttribute: (_: string, value: string) => {
              chromeColor = value;
            },
          }),
        },
      });
      assert.equal(
        root.dataset.theme,
        resolvedTheme(themePreference(saved), systemDark),
      );
      assert.equal(
        chromeColor,
        root.dataset.theme === "dark" ? "#0e1b2d" : "#f4f3ec",
      );
    }
  }
});

test("denied storage does not prevent initialization or changing theme", () => {
  const blocked = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("denied");
    },
  };
  assert.equal(readTheme(blocked), "system");
  assert.doesNotThrow(() => saveTheme(blocked, "dark"));
  const root = { dataset: {} as Record<string, string> };
  runInNewContext(script, {
    localStorage: blocked,
    matchMedia: () => ({ matches: true }),
    document: {
      documentElement: root,
      querySelector: () => ({ setAttribute() {} }),
    },
  });
  assert.equal(root.dataset.theme, "dark");
});

test("explicit choice persists and system mode can be restored", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  saveTheme(storage, "dark");
  assert.equal(readTheme(storage), "dark");
  assert.equal(resolvedTheme(readTheme(storage), false), "dark");
  saveTheme(storage, "system");
  assert.equal(resolvedTheme(readTheme(storage), false), "light");
  assert.equal(resolvedTheme(readTheme(storage), true), "dark");
});
