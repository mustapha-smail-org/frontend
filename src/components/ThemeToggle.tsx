"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/components/ThemeProvider";
import { useIsDark } from "@/lib/useIsDark";

/** Binary theme switch. Defaults to the system theme (mode "system") until the
 *  user flips it, at which point the explicit choice is persisted (localStorage
 *  via ThemeProvider). */
export function ThemeToggle() {
  const { setMode } = useThemeMode();
  const dark = useIsDark();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={dark ? "Thème sombre" : "Thème clair"}
      className="theme-toggle"
      data-dark={dark}
      onClick={() => setMode(dark ? "light" : "dark")}
    >
      <span className="tt-track"><span className="tt-knob">{dark ? <Moon size={12} aria-hidden="true" /> : <Sun size={12} aria-hidden="true" />}</span></span>
    </button>
  );
}
