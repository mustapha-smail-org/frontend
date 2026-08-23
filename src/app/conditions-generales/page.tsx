import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Conditions générales d’utilisation",
    alternates: {canonical: "/conditions-generales"},
};

export default function TermsPage() {
    return (
        <section className="shell-pad py-16">
            <article className="rich-text mx-auto max-w-3xl">
                <p className="eyebrow">Paname Spot</p>
                <h1 className="text-5xl font-extrabold text-[var(--midnight)]">Conditions générales
                    d’utilisation</h1>
                <p className="muted-copy">Dernière mise à jour : 23 août 2026.</p>

                <h2>Objet</h2>
                <p>Les présentes conditions régissent l’utilisation du site panamespot.fr, service gratuit
                    d’information sur les événements parisiens. En accédant au site, vous acceptez ces
                    conditions. Si vous les refusez, n’utilisez pas le site.</p>

                <h2>Accès au service</h2>
                <p>Le service est accessible sans création de compte. Il est fourni « en l’état », selon sa
                    disponibilité. L’éditeur peut faire évoluer, suspendre ou interrompre tout ou partie du
                    service à tout moment, sans préavis ni indemnité.</p>

                <h2>Contenus et exactitude</h2>
                <p>Les informations d’événements proviennent de sources publiques (Paris Open Data) et sont
                    fournies à titre indicatif. Malgré le soin apporté à leur mise à jour, elles peuvent être
                    incomplètes, obsolètes ou erronées&nbsp;: horaires, tarifs, lieux et disponibilités
                    doivent être vérifiés auprès de l’organisateur avant tout déplacement. L’éditeur ne saurait
                    être tenu responsable des conséquences d’une information inexacte ou d’un événement modifié
                    ou annulé.</p>

                <h2>Comportement des utilisateurs</h2>
                <p>Lorsque vous envoyez un avis ou un signalement, vous vous engagez à ne pas transmettre de
                    contenu illicite, diffamatoire, injurieux, ou portant atteinte aux droits de tiers.
                    L’éditeur peut supprimer tout contenu inapproprié et restreindre l’accès en cas d’usage
                    abusif du service.</p>

                <h2>Propriété intellectuelle</h2>
                <p>La marque, le logo et les éléments propres au site sont protégés et ne peuvent être
                    réutilisés sans autorisation. Les données publiques réutilisées demeurent soumises à leurs
                    licences d’origine.</p>

                <h2>Données personnelles</h2>
                <p>Le traitement de vos données est décrit dans la
                    page <Link href="/confidentialite">Confidentialité</Link> et la gestion des cookies dans
                    la page <Link href="/cookies">Cookies</Link>.</p>

                <h2>Responsabilité</h2>
                <p>L’éditeur ne garantit pas l’absence d’interruptions ou d’erreurs et ne saurait être tenu
                    responsable des dommages indirects liés à l’utilisation du site ou à l’impossibilité d’y
                    accéder. Les liens vers des sites tiers sont fournis pour votre commodité&nbsp;; leur
                    contenu n’engage que leurs éditeurs.</p>

                <h2>Droit applicable</h2>
                <p>Les présentes conditions sont soumises au droit français. À défaut de résolution amiable,
                    tout litige relève de la compétence des tribunaux français.</p>

                <h2>Contact</h2>
                <p>Pour toute question relative à ces conditions&nbsp;:
                    <a href="mailto:contact@panamespot.fr"> contact@panamespot.fr</a>.</p>
            </article>
        </section>
    );
}
