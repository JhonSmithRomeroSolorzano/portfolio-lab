import { useEffect, useLayoutEffect, useState } from "react";
import {
  THEME_KEY,
  readTheme,
  resolvedTheme,
  saveTheme,
  themePreference,
} from "./theme-preference";
import type { ThemePreference } from "./theme-preference";

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    try {
      return readTheme(window.localStorage);
    } catch {
      return "system";
    }
  });
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => setSystemDark(query.matches);
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        setPreference(themePreference(event.newValue));
    };
    query.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    onSystem();
    return () => {
      query.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    const theme = resolvedTheme(preference, systemDark);
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0e1b2d" : "#f4f3ec");
  }, [preference, systemDark]);

  function choose(next: ThemePreference) {
    setPreference(next);
    try {
      saveTheme(window.localStorage, next);
    } catch {
      /* Storage access itself can be denied. */
    }
  }

  return (
    <div className="theme-switcher" role="group" aria-label="Color theme">
      {(["light", "dark", "system"] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          aria-pressed={preference === choice}
          onClick={() => choose(choice)}
        >
          {choice === "light" ? "Light" : choice === "dark" ? "Dark" : "System"}
        </button>
      ))}
    </div>
  );
}
