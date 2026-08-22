import type {Metadata} from "next";

export const metadata: Metadata = {title: "Mentions légales", alternates: {canonical: "/mentions-legales"}};
export default function LegalPage() {
    return <Legal title="Mentions légales"><h2>Éditeur</h2><p>Paname Spot est un service d’information consacré aux
        événements parisiens. Les coordonnées complètes de l’éditeur devront être renseignées avant la mise en
        production publique.</p><h2>Données et contenus</h2><p>Les informations d’événements proviennent de Paris Open
        Data. Les textes, visuels et crédits restent attribués à leurs sources respectives. Paname Spot ne garantit pas
        qu’un événement n’a pas été modifié ou annulé après sa dernière mise à jour.</p><h2>Hébergement</h2><p>Les
        informations de l’hébergeur devront être complétées dès le choix de l’infrastructure de production.</p></Legal>;
}

function Legal({title, children}: { title: string; children: React.ReactNode }) {
    return <section className="shell-pad py-16">
        <article className="rich-text mx-auto max-w-3xl"><p className="eyebrow">Paname Spot</p><h1
            className="text-5xl font-extrabold text-[var(--midnight)]">{title}</h1>{children}</article>
    </section>;
}
