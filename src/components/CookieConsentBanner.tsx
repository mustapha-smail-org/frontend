"use client";

import Link from "next/link";
import {analyticsEnabled, useConsent} from "@/lib/analytics";

/** Bottom consent banner shown until the visitor makes a choice. Refusing is
 *  persisted too, so it does not reappear until the choice is reset from the
 *  cookies page. `useConsent` reports `null` during SSR/hydration, so the
 *  banner stays hydration-safe without a mount gate. */
export function CookieConsentBanner() {
    const {choice, setChoice} = useConsent();

    if (!analyticsEnabled || choice !== null) return null;

    return (
        <div className="consent-banner" role="dialog" aria-label="Consentement aux cookies" aria-live="polite">
            <div className="consent-inner">
                <p className="consent-text">
                    Nous utilisons des cookies de mesure d’audience (Google Analytics) pour améliorer le site.
                    Ils ne sont déposés qu’avec votre accord. <Link href="/cookies">En savoir plus</Link>.
                </p>
                <div className="consent-actions">
                    <button type="button" className="consent-btn consent-refuse" onClick={() => setChoice("denied")}>
                        Refuser
                    </button>
                    <button type="button" className="consent-btn consent-accept" onClick={() => setChoice("granted")}>
                        Accepter
                    </button>
                </div>
            </div>
        </div>
    );
}
