"use client";

import {createContext, useContext, type ReactNode} from "react";

/** GA4 measurement id, provided from the server layout which reads it from the
 *  runtime env (process.env.GA_ID). It is NOT a NEXT_PUBLIC var, so it is not
 *  baked into the client bundle at build time — the id is per-environment and
 *  changeable without a rebuild. An empty string disables analytics entirely. */
const GaIdContext = createContext<string>("");

export function AnalyticsProvider({gaId, children}: {gaId: string; children: ReactNode}) {
    return <GaIdContext.Provider value={gaId}>{children}</GaIdContext.Provider>;
}

export function useGaId(): string {
    return useContext(GaIdContext);
}

export function useAnalyticsEnabled(): boolean {
    return useGaId().length > 0;
}
