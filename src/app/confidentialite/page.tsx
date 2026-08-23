import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {title: "Confidentialité", alternates: {canonical: "/confidentialite"}};

export default function PrivacyPage() {
    return (
        <section className="shell-pad py-16">
            <article className="rich-text mx-auto max-w-3xl">
                <p className="eyebrow">Paname Spot</p>
                <h1 className="text-5xl font-extrabold text-[var(--midnight)]">Confidentialité</h1>
                <p className="muted-copy">Dernière mise à jour : 23 août 2026.</p>

                <p>La présente politique décrit les données traitées lorsque vous utilisez panamespot.fr et
                    les droits dont vous disposez. Le responsable de traitement est l’éditeur du site,
                    joignable à <a href="mailto:contact@panamespot.fr">contact@panamespot.fr</a>.</p>

                <h2>Données collectées</h2>
                <p>La consultation des événements ne nécessite aucun compte. Des données personnelles ne sont
                    enregistrées que lorsque vous choisissez d’interagir avec le service&nbsp;:</p>
                <ul>
                    <li><strong>Avis et signalements</strong>&nbsp;: le message, la catégorie de retour et,
                        facultativement, une adresse e-mail que vous saisissez.</li>
                    <li><strong>Mesure d’audience</strong>&nbsp;: si vous y consentez, des données de
                        navigation collectées via Google Analytics (voir ci-dessous et
                        la page <Link href="/cookies">Cookies</Link>).</li>
                    <li><strong>Journaux techniques</strong>&nbsp;: pour la sécurité et le bon fonctionnement,
                        l’hébergeur peut conserver temporairement des données techniques usuelles (adresse IP,
                        horodatage, type de navigateur).</li>
                </ul>

                <h2>Finalités et bases légales</h2>
                <ul>
                    <li>Traiter et corriger les données d’événements à partir de vos retours — intérêt
                        légitime à améliorer le service.</li>
                    <li>Mesurer l’audience du site — sur la base de votre consentement, révocable à tout
                        moment.</li>
                    <li>Assurer la sécurité et la disponibilité du service — intérêt légitime.</li>
                </ul>

                <h2>Mesure d’audience</h2>
                <p>Le site utilise Google Analytics pour comprendre l’usage des pages. Les cookies de mesure
                    d’audience ne sont déposés qu’après votre consentement et ne sont pas activés par défaut.
                    Vous pouvez accepter ou refuser, puis modifier votre choix à tout moment depuis la
                    page <Link href="/cookies">Cookies</Link>. Ce service peut impliquer un transfert de
                    données hors de l’Union européenne, encadré par les garanties prévues par Google.</p>

                <h2>Services cartographiques</h2>
                <p>Les cartes utilisent des fonds OpenStreetMap distribués par CARTO. Le chargement d’une
                    carte peut transmettre à ces services des informations techniques usuelles (dont votre
                    adresse IP) nécessaires à l’affichage des tuiles.</p>

                <h2>Destinataires</h2>
                <p>Vos données ne sont ni vendues ni cédées. Elles ne sont accessibles qu’à l’éditeur et à
                    ses sous-traitants techniques (hébergeur OVH, et, le cas échéant, Google pour la mesure
                    d’audience), agissant selon nos instructions.</p>

                <h2>Durée de conservation</h2>
                <p>Les avis et signalements sont conservés le temps nécessaire au traitement puis à la tenue
                    d’un historique raisonnable, dans la limite de <strong>13 mois</strong>. Les données de
                    mesure d’audience sont conservées au maximum <strong>14 mois</strong>. Les journaux
                    techniques sont conservés pour une durée courte à des fins de sécurité.</p>

                <h2>Vos droits</h2>
                <p>Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement,
                    de limitation et d’opposition, ainsi que d’un droit à la portabilité. Pour l’exercer,
                    écrivez à <a href="mailto:contact@panamespot.fr">contact@panamespot.fr</a>. Vous pouvez
                    également introduire une réclamation auprès de la CNIL
                    (<a href="https://www.cnil.fr" rel="noreferrer" target="_blank">cnil.fr</a>).</p>
            </article>
        </section>
    );
}
