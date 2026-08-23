import type {Metadata} from "next";

export const metadata: Metadata = {title: "Mentions légales", alternates: {canonical: "/mentions-legales"}};

export default function LegalPage() {
    return (
        <LegalLayout title="Mentions légales">
            <p className="muted-copy">Dernière mise à jour : 23 août 2026.</p>

            <h2>Éditeur du site</h2>
            <p>Le site <strong>panamespot.fr</strong> (« Paname Spot ») est édité par une personne physique
                agissant à titre non professionnel. Conformément à l’article 6, III, 2° de la loi n° 2004-575
                du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), l’éditeur a choisi de
                conserver l’anonymat auprès du public&nbsp;: son identité et ses coordonnées ont été communiquées
                à l’hébergeur, qui les tient à la disposition des autorités compétentes.</p>
            <p>Toute demande peut être adressée à l’éditeur par courrier électronique à
                l’adresse <a href="mailto:contact@panamespot.fr">contact@panamespot.fr</a>.</p>

            <h2>Directeur de la publication</h2>
            <p>Le directeur de la publication est l’éditeur du site, joignable
                à <a href="mailto:contact@panamespot.fr">contact@panamespot.fr</a>.</p>

            <h2>Hébergeur</h2>
            <p>Le site est hébergé par&nbsp;:</p>
            <p>OVH SAS<br/>2 rue Kellermann<br/>59100 Roubaix — France<br/>
                Téléphone&nbsp;: +33 9 72 10 10 07<br/>
                Site&nbsp;: <a href="https://www.ovhcloud.com" rel="noreferrer" target="_blank">ovhcloud.com</a></p>

            <h2>Données et contenus</h2>
            <p>Les informations d’événements proviennent de Paris Open Data. Les textes, visuels et crédits
                restent attribués à leurs sources respectives. Paname Spot ne garantit pas qu’un événement
                n’a pas été modifié ou annulé après sa dernière mise à jour, et ne saurait être tenu
                responsable d’un déplacement effectué sur la foi de ces informations.</p>

            <h2>Propriété intellectuelle</h2>
            <p>La marque « Paname Spot », le logo, la charte graphique et les éléments d’interface propres au
                site sont protégés. Toute reproduction ou réutilisation sans autorisation préalable est
                interdite. Les données publiques réutilisées restent soumises à leurs licences d’origine.</p>

            <h2>Signaler un contenu</h2>
            <p>Pour signaler une erreur ou un contenu manifestement illicite, écrivez
                à <a href="mailto:contact@panamespot.fr">contact@panamespot.fr</a> en précisant l’événement
                concerné.</p>
        </LegalLayout>
    );
}

function LegalLayout({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="shell-pad py-16">
            <article className="rich-text mx-auto max-w-3xl">
                <p className="eyebrow">Paname Spot</p>
                <h1 className="text-5xl font-extrabold text-[var(--midnight)]">{title}</h1>
                {children}
            </article>
        </section>
    );
}
