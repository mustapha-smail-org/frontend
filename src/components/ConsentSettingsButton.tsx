"use client";

import {analyticsEnabled, useConsent} from "@/lib/analytics";

/** Shows the current cookie choice and lets the visitor change it (resets the
 *  stored consent, which brings the banner back). Backs the "modifier votre
 *  choix" promise on the cookies page. */
export function ConsentSettingsButton() {
    const {choice, reset} = useConsent();

    if (!analyticsEnabled) return null;

    const label = choice === "granted"
        ? "Vous avez accepté les cookies de mesure d’audience."
        : choice === "denied"
            ? "Vous avez refusé les cookies de mesure d’audience."
            : "Aucun choix n’est enregistré pour le moment.";

    return (
        <p>
            {label}{" "}
            <button type="button" className="consent-link-btn" onClick={reset}>Modifier mon choix</button>
        </p>
    );
}
