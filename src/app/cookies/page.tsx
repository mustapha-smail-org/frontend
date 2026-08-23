import type {Metadata} from "next";
import Link from "next/link";
import {ConsentSettingsButton} from "@/components/ConsentSettingsButton";

export const metadata: Metadata = {title: "Cookies", alternates: {canonical: "/cookies"}};

export default function CookiesPage() {
    return (
        <section className="shell-pad py-16">
            <article className="rich-text mx-auto max-w-3xl">
                <p className="eyebrow">Paname Spot</p>
                <h1 className="text-5xl font-extrabold text-[var(--midnight)]">Cookies</h1>
                <p className="muted-copy">Dernière mise à jour : 23 août 2026.</p>

                <p>Un cookie est un petit fichier déposé sur votre appareil lors de la visite d’un site. Cette
                    page explique lesquels sont utilisés sur panamespot.fr et comment gérer vos choix.</p>

                <h2>Cookies strictement nécessaires</h2>
                <p>Ces cookies et stockages locaux permettent le fonctionnement du site (mémorisation de vos
                    préférences, comme le thème clair/sombre, et enregistrement de votre choix en matière de
                    cookies). Ils ne requièrent pas votre consentement et ne servent pas au suivi
                    publicitaire.</p>

                <h2>Cookies de mesure d’audience</h2>
                <p>Le site utilise Google Analytics pour mesurer la fréquentation et améliorer le service. Ces
                    cookies ne sont déposés qu’<strong>après votre consentement</strong> et ne sont pas
                    activés par défaut. Ils permettent d’établir des statistiques de visites (pages consultées,
                    provenance, appareil).</p>

                <h2>Gérer vos choix</h2>
                <p>Vous pouvez accepter ou refuser les cookies non essentiels lors de votre visite, puis
                    modifier votre choix à tout moment ci-dessous. Vous pouvez également configurer votre
                    navigateur pour bloquer ou supprimer les cookies&nbsp;; le blocage des cookies strictement
                    nécessaires peut toutefois dégrader certaines fonctionnalités.</p>
                <ConsentSettingsButton/>

                <h2>Durée de conservation</h2>
                <p>Le consentement est conservé au maximum 6 mois&nbsp;; passé ce délai, votre choix vous est
                    à nouveau demandé. Les cookies de mesure d’audience sont conservés au maximum 14 mois.</p>

                <h2>En savoir plus</h2>
                <p>Le traitement des données associées est détaillé dans la
                    page <Link href="/confidentialite">Confidentialité</Link>. Pour toute question&nbsp;:
                    <a href="mailto:contact@panamespot.fr"> contact@panamespot.fr</a>.</p>
            </article>
        </section>
    );
}
