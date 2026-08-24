"use client";

import Script from "next/script";
import {usePathname} from "next/navigation";
import {useEffect, useRef} from "react";
import {gaBootstrap, gaScriptSrc, trackPageView, useConsent} from "@/lib/analytics";
import {useGaId} from "@/components/AnalyticsProvider";

/** Loads Google Analytics only once consent is granted (load-on-consent) and
 *  sends a page_view on each subsequent client navigation. Nothing from Google
 *  is fetched or executed before the user accepts. */
export function Analytics() {
    const gaId = useGaId();
    const {choice} = useConsent();
    const pathname = usePathname();
    const active = gaId.length > 0 && choice === "granted";
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (!active || !pathname) return;
        // The first path is already covered by gaBootstrap's `config` page_view.
        if (lastPath.current === null) {
            lastPath.current = pathname;
            return;
        }
        if (lastPath.current !== pathname) {
            lastPath.current = pathname;
            trackPageView(pathname);
        }
    }, [active, pathname]);

    if (!active) return null;

    return (
        <>
            <Script src={gaScriptSrc(gaId)} strategy="afterInteractive"/>
            <Script id="ga-init" strategy="afterInteractive" dangerouslySetInnerHTML={{__html: gaBootstrap(gaId)}}/>
        </>
    );
}
