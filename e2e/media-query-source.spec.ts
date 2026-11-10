import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import type { MediaProbeWindow } from "./fixtures/media-query-probe";

const A = "(min-width: 600px)";
const B = "(prefers-color-scheme: dark)";
type QueryMetrics = {
  query: string;
  reads: number;
  adds: number;
  removes: number;
  active: number;
};
type FixtureWindow = MediaProbeWindow & {
  mediaQueryFixture: {
    metrics(): QueryMetrics[];
    notify(query: string, value: boolean, lagFresh?: boolean): void;
  };
};
let fixture: string;
async function buildFixture() {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL("./fixtures/media-query-probe.ts", import.meta.url),
        ),
        formats: ["es"],
        fileName: "media-query-probe",
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const output = outputs[0];
  if (outputs.length !== 1 || !("output" in output))
    throw new Error("Expected one fixture bundle");
  const entry = output.output.find(
    (item) => item.type === "chunk" && item.isEntry,
  );
  if (!entry || entry.type !== "chunk")
    throw new Error("Missing fixture entry");
  fixture = entry.code;
}

async function openProbe(page: Page, query = A, hydrate = false) {
  await page.addInitScript(
    ({ a, b }) => {
      const values = new Map([
        [a, false],
        [b, true],
      ]);
      const states: {
        query: string;
        matches: boolean;
        reads: number;
        adds: number;
        removes: number;
        target: EventTarget;
        listeners: Set<EventListenerOrEventListenerObject>;
      }[] = [];
      let lagFresh = false;
      window.matchMedia = (query) => {
        const state = {
          query,
          matches: lagFresh ? !values.get(query) : !!values.get(query),
          reads: 0,
          adds: 0,
          removes: 0,
          target: new EventTarget(),
          listeners: new Set<EventListenerOrEventListenerObject>(),
        };
        states.push(state);
        return {
          get matches() {
            state.reads++;
            return state.matches;
          },
          media: query,
          onchange: null,
          addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
          ) {
            if (!state.listeners.has(listener)) {
              state.listeners.add(listener);
              state.adds++;
            }
            state.target.addEventListener(type, listener);
          },
          removeEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
          ) {
            if (state.listeners.delete(listener)) state.removes++;
            state.target.removeEventListener(type, listener);
          },
          dispatchEvent: state.target.dispatchEvent.bind(state.target),
        } as unknown as MediaQueryList;
      };
      Object.defineProperty(window, "mediaQueryFixture", {
        value: {
          metrics: () =>
            states.map((state) => ({
              query: state.query,
              reads: state.reads,
              adds: state.adds,
              removes: state.removes,
              active: state.listeners.size,
            })),
          notify(query: string, value: boolean, lag: boolean) {
            values.set(query, value);
            for (const state of states)
              if (state.query === query) state.matches = value;
            lagFresh = !!lag;
            try {
              for (const state of [...states])
                if (state.query === query)
                  state.target.dispatchEvent(new Event("change"));
            } finally {
              lagFresh = false;
              for (const state of states)
                state.matches = !!values.get(state.query);
            }
          },
        },
      });
    },
    { a: A, b: B },
  );
  const markup = hydrate
    ? `<output data-testid="media-match" data-query="${query}" data-tick="0">false</output>`
    : "";
  await page.route("**/__media-query-probe", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div id="media-probe" data-query="${query}" data-hydrate="${hydrate}">${markup}</div>`,
    }),
  );
  await page.goto("/__media-query-probe");
  if (hydrate) {
    await expect(page.getByTestId("media-match")).toHaveText("false");
    expect(await metrics(page)).toEqual([]);
  }
  await page.addScriptTag({ type: "module", content: fixture });
  await expect(page.getByTestId("media-match")).toHaveAttribute(
    "data-query",
    query,
  );
  await expect
    .poll(async () =>
      (await metrics(page)).reduce((sum, state) => sum + state.active, 0),
    )
    .toBe(1);
}

const metrics = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as FixtureWindow).mediaQueryFixture.metrics(),
  );
const notify = (page: Page, query: string, value: boolean, lagFresh = false) =>
  page.evaluate(
    ({ query, value, lagFresh }) =>
      (window as unknown as FixtureWindow).mediaQueryFixture.notify(
        query,
        value,
        lagFresh,
      ),
    { query, value, lagFresh },
  );

test.describe("hook fixture", () => {
  test.beforeAll(buildFixture);
  test("subscription and snapshots share their source even when fresh instances lag", async ({
    page,
  }) => {
    await openProbe(page);
    const output = page.getByTestId("media-match");
    await expect(output).toHaveText("false");
    for (const value of [true, false, true, false]) {
      await notify(page, A, value, true);
      await expect(output).toHaveText(String(value));
    }
    const sources = await metrics(page);
    expect(sources).toHaveLength(1);
    expect(sources[0].active).toBe(1);
    expect(sources[0].reads).toBeGreaterThan(0);
  });

  test("query changes release the previous source and ordinary renders do not recreate it", async ({
    page,
  }) => {
    await openProbe(page);
    const output = page.getByTestId("media-match");
    await expect(output).toHaveText("false");
    const before = await metrics(page);
    for (let i = 0; i < 3; i++) {
      const tick = await page.evaluate(
        (query) =>
          (window as unknown as MediaProbeWindow).mediaQueryProbe.render(query),
        A,
      );
      await expect(output).toHaveAttribute("data-tick", String(tick));
    }
    expect((await metrics(page)).length).toBe(before.length);
    await page.evaluate(
      (query) =>
        (window as unknown as MediaProbeWindow).mediaQueryProbe.render(query),
      B,
    );
    await expect(output).toHaveAttribute("data-query", B);
    await expect(output).toHaveText("true");
    await expect
      .poll(async () => {
        const switched = await metrics(page);
        return {
          previous: switched
            .filter((state) => state.query === A)
            .reduce((sum, state) => sum + state.active, 0),
          current: switched
            .filter((state) => state.query === B)
            .reduce((sum, state) => sum + state.active, 0),
        };
      })
      .toEqual({ previous: 0, current: 1 });
    await notify(page, B, false);
    await expect(output).toHaveText("false");
    await notify(page, A, true);
    await page.evaluate(
      (query) =>
        (window as unknown as MediaProbeWindow).mediaQueryProbe.render(query),
      A,
    );
    await expect(output).toHaveAttribute("data-query", A);
    await expect(output).toHaveText("true");
    await page.evaluate(() =>
      (window as unknown as MediaProbeWindow).mediaQueryProbe.unmount(),
    );
    await expect(output).toHaveCount(0);
    const released = await metrics(page);
    expect(
      released.every(
        (state) => state.active === 0 && state.adds === state.removes,
      ),
    ).toBe(true);
  });

  test("hydration keeps the server snapshot then adopts the browser value without errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await openProbe(page, B, true);
    await expect(page.getByTestId("media-match")).toHaveText("true");
    await notify(page, B, false);
    await expect(page.getByTestId("media-match")).toHaveText("false");
    expect(errors).toEqual([]);
  });
});

for (const width of [390, 1440]) {
  test(`native system-theme updates and explicit keyboard choices stay consistent at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    const toggle = page.locator(".theme-toggle");
    await expect(toggle).toBeEnabled();
    for (const theme of ["dark", "light", "dark", "light"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
      );
    }
    await toggle.focus();
    await toggle.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toBeFocused();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(
      await page.evaluate(() => localStorage.getItem("portfolio-theme")),
    ).toBe("dark");
  });
}
