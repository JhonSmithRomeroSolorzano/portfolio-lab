import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  THEME_KEY,
  readTheme,
  nextTheme,
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
      let favicon = "";
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
          querySelector: (selector: string) => ({
            setAttribute: (_: string, value: string) => {
              if (selector === 'meta[name="theme-color"]') chromeColor = value;
              if (selector === 'link[rel="icon"]') favicon = value;
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
      assert.equal(
        favicon,
        root.dataset.theme === "dark" ? "./favicon-dark.svg" : "./favicon.svg",
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

test("one toggle switches the actual theme and persists an explicit choice", () => {
  for (const preference of ["system", "light", "dark"] as const) {
    for (const systemDark of [true, false]) {
      const next = nextTheme(preference, systemDark);
      assert.notEqual(next, resolvedTheme(preference, systemDark));
      let stored: string | null = null;
      const storage = {
        getItem: () => stored,
        setItem: (_: string, value: string) => {
          stored = value;
        },
      };
      saveTheme(storage, next);
      assert.equal(resolvedTheme(readTheme(storage), !systemDark), next);
      assert.equal(
        nextTheme(next, systemDark),
        resolvedTheme(preference, systemDark),
      );
    }
  }
});
