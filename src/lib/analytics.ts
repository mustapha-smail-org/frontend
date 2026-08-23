"use client";

import {useCallback, useMemo, useSyncExternalStore} from "react";

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "ps-consent";

/** GA4 Measurement ID. Overridable per environment; the production ID is the
 *  default so the tag also works from a plain build. An empty value disables
 *  analytics entirely — the consent banner included. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-NR5L2VGXGC";

export const analyticsEnabled = GA_MEASUREMENT_ID.length > 0;

export function gaScriptSrc(id: string = GA_MEASUREMENT_ID): string {
    return `https://www.googletagmanager.com/gtag/js?id=${id}`;
}

/** Inline bootstrap for gtag. The `config` call sends the page_view for the
 *  page on which consent was granted; every later SPA navigation is sent by
 *  `trackPageView`. This runs only once the tag is mounted, which we do
 *  exclusively after consent — nothing from Google loads before then. */
export function gaBootstrap(id: string = GA_MEASUREMENT_ID): string {
    return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
}

type Gtag = (...args: unknown[]) => void;

function getGtag(): Gtag | undefined {
    return typeof window === "undefined" ? undefined : (window as unknown as {gtag?: Gtag}).gtag;
}

/** Send a SPA page_view. App Router does client-side navigations, so gtag's
 *  load-time auto page_view only ever covers the first page. */
export function trackPageView(path: string): void {
    getGtag()?.("event", "page_view", {page_path: path});
}

// --- consent store: mirrors the external-store pattern in ThemeProvider so
//     reads stay SSR-safe and every subscriber updates without setState. ---

const listeners = new Set<() => void>();

export function subscribeConsent(callback: () => void) {
    listeners.add(callback);
    if (typeof window !== "undefined") window.addEventListener("storage", callback);
    return () => {
        listeners.delete(callback);
        if (typeof window !== "undefined") window.removeEventListener("storage", callback);
    };
}

export function readConsent(): ConsentChoice | null {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
}

function notify() {
    listeners.forEach((listener) => listener());
}

export function writeConsent(choice: ConsentChoice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch {}
    notify();
}

/** Clear the stored choice so the banner reappears — backs the
 *  "modifier mon choix" control on the cookies page. */
export function resetConsent() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    notify();
}

/** Reactive consent state. Server + hydration snapshot is `null` (undecided);
 *  the client snapshot then reflects the stored choice. */
export function useConsent() {
    const choice = useSyncExternalStore<ConsentChoice | null>(subscribeConsent, readConsent, () => null);
    const setChoice = useCallback((next: ConsentChoice) => writeConsent(next), []);
    const reset = useCallback(() => resetConsent(), []);
    return useMemo(() => ({choice, setChoice, reset}), [choice, setChoice, reset]);
}
