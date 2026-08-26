import Link from "next/link";
import {ArrowRight, CalendarCheck, MapPinned, Sparkles} from "lucide-react";
import {EventGrid} from "@/components/EventGrid";
import {HeroEvent} from "@/components/HeroEvent";
import {HomeMapPreview} from "@/components/HomeMapPreview";
import {getEvents, getMapEvents} from "@/lib/api";
import type {EventMapMarker, EventSummary} from "@/lib/types";

// Prefer the highest-ranked event that actually has a visual (the hero is a
// full-bleed image), falling back to the top-ranked one otherwise.
function pickHero(list: EventSummary[]): EventSummary | undefined {
    return list.find((event) => Boolean(event.imageUrl)) ?? list[0];
}

export default async function Home() {
    let today: EventSummary[] = [];
    let week: EventSummary[] = [];
    let markers: EventMapMarker[] = [];
    let unavailable = false;
    try {
        [today, week, markers] = await Promise.all([
            getEvents({period: "TODAY", sort: "RELEVANCE", limit: 6}).then((page) => page.items),
            getEvents({period: "THIS_WEEK", sort: "RELEVANCE", limit: 12}).then((page) => page.items),
            getMapEvents({period: "THIS_WEEK", limit: 30}).then((page) => page.items),
        ]);
    } catch {
        unavailable = true;
    }
    // Hero: the top-ranked event of today; when nothing runs today, the top of the week.
    const hero = pickHero(today) ?? pickHero(week);
    // "À l'affiche cette semaine": the week's best, minus whatever leads the hero.
    const selection = week.filter((event) => event.id !== hero?.id).slice(0, 4);
    return (
        <>
            {hero ? <HeroEvent event={hero}/> : <section className="home-fallback shell-pad">
                <div><p className="eyebrow">Le guide vivant de Paris</p><h1>Paris,<br/><em>au bon endroit.</em></h1>
                    <p>Les événements sont momentanément indisponibles. Revenez dans quelques instants.</p></div>
            </section>}
            <section className="home-selection shell-pad">
                <div className="mx-auto max-w-[88rem]">
                    <div className="section-heading">
                        <div><p className="eyebrow">À l’affiche cette semaine</p><h2>Une bonne raison de sortir.</h2>
                        </div>
                        <Link href="/decouvrir">Voir toutes les sorties <ArrowRight size={17}/></Link></div>
                    <EventGrid events={selection}
                               emptyMessage={unavailable ? "Le service de sorties ne répond pas pour le moment." : "Aucune sortie publiée cette semaine."}/>
                </div>
            </section>
            <section className="promise-band shell-pad">
                <div className="mx-auto grid max-w-[88rem] md:grid-cols-3">
                    <div><CalendarCheck/><strong>Des dates utiles</strong><p>Les horaires à venir, pas les anciennes
                        dates de publication.</p></div>
                    <div><MapPinned/><strong>Partout dans Paris</strong><p>Explorez les événements sur la carte ou par
                        arrondissement.</p></div>
                    <div><Sparkles/><strong>Des données publiques</strong><p>Informations et visuels issus de la source
                        officielle parisienne.</p></div>
                </div>
            </section>
            {!!markers.length && <section className="home-map-section shell-pad">
                <div className="mx-auto max-w-[88rem]">
                    <div className="section-heading">
                        <div><p className="eyebrow">Au coin de la rue</p><h2>Paris sur la carte</h2></div>
                        <Link href="/decouvrir">Ouvrir la carte <ArrowRight size={17}/></Link></div>
                    <div className="home-map"><HomeMapPreview markers={markers}/></div>
                </div>
            </section>}
            <section className="home-cta shell-pad">
                <div className="mx-auto max-w-[88rem]"><p className="eyebrow">Votre prochaine sortie</p><h2>Paris ne
                    manque pas d’idées.<br/>Vous non plus.</h2><Link href="/decouvrir">Trouver un
                    événement <ArrowRight/></Link></div>
            </section>
        </>
    );
}
