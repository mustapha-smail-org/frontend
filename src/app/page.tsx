import Link from "next/link";
import {ArrowRight, CalendarCheck, MapPinned, Sparkles} from "lucide-react";
import {EventGrid} from "@/components/EventGrid";
import {HeroEvent} from "@/components/HeroEvent";
import {HomeMapPreview} from "@/components/HomeMapPreview";
import {getEvents, getMapEvents} from "@/lib/api";
import type {EventMapMarker, EventSummary} from "@/lib/types";

export default async function Home() {
    let events: EventSummary[] = [];
    let markers: EventMapMarker[] = [];
    let unavailable = false;
    try {
        [events, markers] = await Promise.all([(await getEvents({
            period: "THIS_WEEK",
            limit: 12
        })).items, (await getMapEvents({period: "THIS_WEEK", limit: 30})).items]);
    } catch {
        unavailable = true;
    }
    function hashString(s: string) {
        let h = 5381;
        for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
        return Math.abs(h);
    }
    const eventsWithImage = events.filter((event) => Boolean(event.imageUrl));
    const hero = eventsWithImage.length ? eventsWithImage[hashString(eventsWithImage.map((e) => e.id).join("|")) % eventsWithImage.length] : events[0];
    const selection = events.filter((event) => event.id !== hero?.id).slice(0, 4);
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
