import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Flame, Heart, Hourglass, Leaf, Moon, Sparkles, Ticket } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { EventGrid } from "@/components/EventGrid";
import { getEvents } from "@/lib/api";
import type { EventSummary } from "@/lib/types";
import { buildTodayRails, parisToday } from "@/lib/todayRails";

export const metadata: Metadata = {
  title: "Que faire aujourd’hui à Paris",
  description: "Les événements ouverts et les sorties à faire aujourd’hui à Paris, avec leurs horaires à venir.",
  alternates: { canonical: "/aujourdhui" },
};

export default async function TodayPage() {
  let events: EventSummary[] = [];
  let unavailable = false;
  try { events = (await getEvents({ period: "TODAY", sort: "RELEVANCE", limit: 60 })).items; } catch { unavailable = true; }

  const rails = buildTodayRails(events, parisToday());
  const sections: { id: string; eyebrow: string; icon: ReactNode; title: string; events: EventSummary[] }[] = [
    { id: "incontournables", eyebrow: "À ne pas manquer", icon: <Flame size={15} />, title: "Les incontournables", events: rails.incontournables },
    { id: "gratuit", eyebrow: "Entrée libre", icon: <Ticket size={15} />, title: "Sortir gratuitement", events: rails.gratuit },
    { id: "ce-soir", eyebrow: "Après 17 heures", icon: <Moon size={15} />, title: "Pour ce soir", events: rails.ceSoir },
    { id: "plein-air", eyebrow: "En plein air", icon: <Leaf size={15} />, title: "Dehors aujourd’hui", events: rails.pleinAir },
    { id: "date", eyebrow: "Idéal pour un date", icon: <Heart size={15} />, title: "À deux ce soir", events: rails.date },
    { id: "dernier-jour", eyebrow: "Dernier jour", icon: <Hourglass size={15} />, title: "C’est maintenant ou jamais", events: rails.dernierJour },
    { id: "insolite", eyebrow: "Insolite", icon: <Sparkles size={15} />, title: "Sortir des sentiers battus", events: rails.insolite },
  ].filter((section) => section.events.length > 0);

  return (
    <>
      <section className="today-hero shell-pad">
        <div className="mx-auto max-w-[88rem]">
          <p className="eyebrow"><Clock3 size={16} /> Mis à jour aujourd’hui</p>
          <h1>Paris aujourd’hui,<br /><em>sans perdre une minute.</em></h1>
          <p>Les expositions, concerts, spectacles et rendez-vous accessibles ce jour.</p>
        </div>
      </section>

      {sections.length > 0 && (
        <nav className="today-railnav shell-pad" aria-label="Sections du jour">
          <div className="mx-auto max-w-[88rem] today-railnav-inner">
            {sections.map((section) => (
              <a key={section.id} href={`#rail-${section.id}`} className="railnav-chip">{section.icon}{section.eyebrow}</a>
            ))}
          </div>
        </nav>
      )}

      <section className="today-section shell-pad">
        <div className="mx-auto max-w-[88rem]">
          <div className="section-heading">
            <div><p className="eyebrow">À portée de métro</p><h2>Les sorties du jour</h2></div>
            <Link href="/decouvrir?periode=TODAY">Voir sur la carte <ArrowRight size={17} /></Link>
          </div>
          <EventGrid events={events.slice(0, 9)} emptyMessage={unavailable ? "Le service de sorties ne répond pas pour le moment." : "Aucun événement n’est publié pour aujourd’hui."} />
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} id={`rail-${section.id}`} className="today-rail-section shell-pad">
          <div className="mx-auto max-w-[88rem]">
            <div className="section-heading"><div><p className="eyebrow">{section.icon} {section.eyebrow}</p><h2>{section.title}</h2></div></div>
            <div className="today-rail">
              {section.events.map((event) => (
                <div key={event.id} className="today-rail-item"><EventCard event={event} /></div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
