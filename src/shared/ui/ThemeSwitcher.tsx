import { useMediaQuery } from "../hooks/useMediaQuery";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  THEME_KEY,
  readTheme,
  nextTheme,
  resolvedTheme,
  saveTheme,
  themePreference,
} from "../theme/theme-preference";
import type { ThemePreference } from "../theme/theme-preference";

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    try {
      return readTheme(window.localStorage);
    } catch {
      return "system";
    }
  });
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        setPreference(themePreference(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const theme = resolvedTheme(preference, systemDark);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('link[rel="icon"]')
      ?.setAttribute(
        "href",
        theme === "dark" ? "./favicon-dark.svg" : "./favicon.svg",
      );
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0e1b2d" : "#f4f3ec");
  }, [theme]);
  function toggle() {
    const next = nextTheme(preference, systemDark);
    setPreference(next);
    try {
      saveTheme(window.localStorage, next);
    } catch {
      /* Choice still works for this visit. */
    }
  }
  const label =
    theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        {theme === "light" ? (
          <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
          </>
        )}
      </svg>
      <span>{theme === "light" ? "Dark theme" : "Light theme"}</span>
    </button>
  );
}
