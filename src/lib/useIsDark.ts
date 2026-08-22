"use client";

import { useEffect, useState } from "react";

/** Resolve the effective color scheme: explicit `data-theme` wins, otherwise
 *  the OS preference (matches the CSS token rules). */
function resolveDark(): boolean {
  if (typeof document === "undefined") return false;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Reactive "is the UI currently dark?" — updates on OS change and on the
 *  in-app theme toggle (which mutates `data-theme`). */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(false); // SSR-safe default; corrected on mount
  useEffect(() => {
    const update = () => setDark(resolveDark());
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { media.removeEventListener("change", update); observer.disconnect(); };
  }, []);
  return dark;
}
