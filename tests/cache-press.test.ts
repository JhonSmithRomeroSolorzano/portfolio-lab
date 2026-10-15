import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CachePress } from "../src/features/playground/cache-rescue/CachePress";
import {
  rescueRun,
  rescueSnapshot,
  rescueState,
} from "../src/domain/playground/cache-rescue";
import { ROUNDS } from "../src/features/playground/cache-rescue/rounds";

test("press geometry reproduces exactly from the pinned Anatomy kit", () => {
  const result = execFileSync(
    process.execPath,
    ["scripts/build-cache-press.mjs", "--check"],
    { encoding: "utf8" },
  );
  assert.match(result, /52 solid parts/);
});

test("press cards and readouts follow every existing challenge and strategy", () => {
  for (const settings of ROUNDS) {
    for (const shared of [false, true]) {
      const run = rescueRun(settings, shared);
      const times = new Set([
        -25,
        0,
        50,
        ...run.flatMap((r) => [r.arrival, r.completed]),
      ]);
      for (const time of times) {
        const counts = rescueSnapshot(run, time);
        const html = renderToStaticMarkup(
          createElement(CachePress, { run, time, settings, counts }),
        );
        assert.equal(
          (html.match(/data-request=/g) ?? []).length,
          settings.requests,
        );
        for (const request of run) {
          assert.ok(
            html.includes(
              `data-request="${request.id}" data-state="${rescueState(request, time)}"`,
            ),
          );
        }
        assert.ok(
          html.includes(`<dt>Origin reads</dt><dd>${counts.queries}</dd>`),
        );
        assert.ok(html.includes(`<dt>Delivered</dt><dd>${counts.done}</dd>`));
        assert.ok(
          html.includes(
            time >= settings.originMs ? "MASTER READY" : "NO CACHED MASTER",
          ),
        );
        assert.doesNotMatch(html, /NaN|Infinity|<script|<canvas/);
      }
    }
  }
});
