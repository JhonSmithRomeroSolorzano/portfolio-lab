export type ThemePreference = "light" | "dark" | "system";
export const THEME_KEY = "portfolio-theme";

export function themePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function readTheme(storage: Pick<Storage, "getItem">): ThemePreference {
  try {
    return themePreference(storage.getItem(THEME_KEY));
  } catch {
    return "system";
  }
}

export function saveTheme(
  storage: Pick<Storage, "setItem">,
  preference: ThemePreference,
): void {
  try {
    storage.setItem(THEME_KEY, preference);
  } catch {
    // The choice still applies for this visit when persistence is unavailable.
  }
}

export function resolvedTheme(
  preference: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

/** Toggle the actual appearance, including a first visit following the device. */
export function nextTheme(
  preference: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  return resolvedTheme(preference, systemDark) === "light" ? "dark" : "light";
}
