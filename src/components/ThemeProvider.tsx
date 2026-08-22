"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { panameSpotTheme } from "@/theme/paname-spot";

export type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "ps-theme";

// The persisted choice is the external store; components subscribe via
// useSyncExternalStore so reads stay SSR-safe (server snapshot = "system") and
// the toggle updates every subscriber without setState-in-effect.
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { listeners.delete(callback); window.removeEventListener("storage", callback); };
}
function readMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}
function writeMode(mode: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  listeners.forEach((listener) => listener());
}

/** Sync `data-theme` with the chosen mode. "system" removes the attribute so
 *  `prefers-color-scheme` drives both our CSS tokens and Astryx. */
function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
}

const ThemeContext = createContext<{ mode: ThemeMode; setMode: (mode: ThemeMode) => void }>({
  mode: "system",
  setMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server + hydration render use "system"; the client snapshot then reflects
  // the stored choice (the pre-hydration <head> script already set data-theme,
  // so there is no visual flash).
  const mode = useSyncExternalStore<ThemeMode>(subscribe, readMode, () => "system");

  useEffect(() => { applyMode(mode); }, [mode]);

  const setMode = useCallback((next: ThemeMode) => { writeMode(next); applyMode(next); }, []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      <Theme theme={panameSpotTheme} mode={mode}>{children}</Theme>
    </ThemeContext.Provider>
  );
}
