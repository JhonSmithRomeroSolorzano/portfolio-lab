import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LAB_SETTINGS, setupFromSearch, setupUrl } from "./lab-setup";
import type { LabSettings, SetupId, LabSetup } from "./lab-setup";
type SettingsContext = {
  settings: LabSettings;
  invalid: boolean;
  apply: (setup: LabSetup) => void;
  update: <K extends SetupId>(id: K, change: Partial<LabSettings[K]>) => void;
};
const Context = createContext<SettingsContext | null>(null);
function initialSettings() {
  const { setup } = setupFromSearch(window.location.search);
  return setup
    ? { ...DEFAULT_LAB_SETTINGS, [setup.lab]: setup.settings }
    : DEFAULT_LAB_SETTINGS;
}
export function LabSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(initialSettings);
  const [invalid, setInvalid] = useState(
    () => setupFromSearch(window.location.search).invalid,
  );
  const apply = (setup: LabSetup) => {
    setSettings((current) => ({ ...current, [setup.lab]: setup.settings }));
    setInvalid(false);
  };
  useEffect(() => {
    const restore = () => {
      const result = setupFromSearch(window.location.search);
      if (result.setup)
        setSettings((current) => ({
          ...current,
          [result.setup!.lab]: result.setup!.settings,
        }));
      setInvalid(result.invalid);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const update: SettingsContext["update"] = (id, change) => {
    const next = { ...settings, [id]: { ...settings[id], ...change } };
    setSettings(next);
    setInvalid(false);
    if (new URLSearchParams(window.location.search).get("lab") === id)
      window.history.replaceState(
        window.history.state,
        "",
        setupUrl(window.location.href, id, next),
      );
  };
  return (
    <Context.Provider value={{ settings, invalid, update, apply }}>
      {children}
    </Context.Provider>
  );
}
export function useLabSettings() {
  const context = useContext(Context);
  if (!context) throw new Error("Lab settings require their provider.");
  return context;
}
export function useIndependentLab<K extends SetupId>(id: K) {
  const { settings, update } = useLabSettings();
  return [
    settings[id],
    (change: Partial<LabSettings[K]>) => update(id, change),
  ] as const;
}
