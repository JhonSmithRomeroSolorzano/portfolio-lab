import { expect, test } from "@playwright/test";

test("motion subscription and snapshot stay consistent when new media-query instances lag a notification", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = window.matchMedia.bind(window);
    const queries: { target: EventTarget; matches: boolean }[] = [];
    let value = false,
      notifying = false;
    window.matchMedia = (query) => {
      if (query !== "(prefers-reduced-motion: reduce)") return native(query);
      // Model two query objects briefly disagreeing during a delivered change.
      // This is a deterministic store-contract test, not a fake device profile.
      const state = {
        target: new EventTarget(),
        matches: notifying && !value ? true : value,
      };
      queries.push(state);
      return {
        get matches() {
          return state.matches;
        },
        media: query,
        onchange: null,
        addEventListener: state.target.addEventListener.bind(state.target),
        removeEventListener: state.target.removeEventListener.bind(
          state.target,
        ),
        dispatchEvent: state.target.dispatchEvent.bind(state.target),
      } as MediaQueryList;
    };
    Object.defineProperty(window, "setTestDeviceMotion", {
      value: (next: boolean) => {
        value = next;
        const subscribed = [...queries];
        for (const state of subscribed) state.matches = next;
        notifying = true;
        try {
          for (const state of subscribed)
            state.target.dispatchEvent(new Event("change"));
        } finally {
          notifying = false;
          for (const state of queries) state.matches = next;
        }
      },
    });
  });
  await page.goto("/#gravity-loom");
  const section = page.locator("#gravity-loom"),
    play = section.getByRole("button", { name: "Play", exact: true });
  await expect(section.locator(".loom-stage")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await section.getByRole("button", { name: "Pause", exact: true }).click();
  for (const reduced of [true, false, true, false]) {
    await page.evaluate(
      (value) =>
        (
          window as unknown as { setTestDeviceMotion(value: boolean): void }
        ).setTestDeviceMotion(value),
      reduced,
    );
    if (reduced) await expect(play).toBeDisabled();
    else await expect(play).toBeEnabled();
    await expect(section.locator(".loom-stage")).toHaveAttribute(
      "data-playing",
      "false",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-motion",
      reduced ? "reduce" : "full",
    );
  }
});

test("rapid native device-motion transitions restore Loom controls without clearing manual pause", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const events: object[] = [];
    const record = (label: string, eventMatches?: boolean) => {
      events.push({
        label,
        time: performance.now(),
        eventMatches,
        persistent: query.matches,
        fresh: matchMedia(query.media).matches,
        root: document.documentElement.dataset.motion,
        playDisabled: [
          ...document.querySelectorAll<HTMLButtonElement>(
            "#gravity-loom button",
          ),
        ].find((button) => button.textContent === "Play")?.disabled,
      });
      if (events.length > 64) events.shift();
    };
    query.addEventListener("change", (event) =>
      record("native change", event.matches),
    );
    Object.defineProperty(window, "motionDiagnostics", {
      value: { events, record },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#gravity-loom");
  const section = page.locator("#gravity-loom"),
    stage = section.locator(".loom-stage");
  await expect(stage).toHaveAttribute("data-playing", "true");
  await section
    .getByRole("button", { name: "Pause", exact: true })
    .press("Enter");
  try {
    for (let cycle = 0; cycle < 12; cycle++) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        section.getByRole("button", { name: "Play", exact: true }),
      ).toBeDisabled();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(
        section.getByRole("button", { name: "Play", exact: true }),
      ).toBeEnabled();
      await expect(stage).toHaveAttribute("data-playing", "false");
    }
  } finally {
    const diagnostics = await page.evaluate(() => {
      const probe = (
        window as unknown as {
          motionDiagnostics: { events: object[]; record(label: string): void };
        }
      ).motionDiagnostics;
      probe.record("final");
      return {
        events: probe.events,
        deviceReduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        root: document.documentElement.dataset.motion,
        playing: document
          .querySelector(".loom-stage")
          ?.getAttribute("data-playing"),
        controls: [
          ...document.querySelectorAll<HTMLButtonElement>(
            "#gravity-loom button",
          ),
        ].map((button) => ({
          text: button.textContent,
          disabled: button.disabled,
        })),
      };
    });
    await info.attach("native-motion-diagnostics", {
      body: JSON.stringify(diagnostics, null, 2),
      contentType: "application/json",
    });
  }
});
