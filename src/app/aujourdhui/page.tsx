import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Flame, Heart, Hourglass, Leaf, Moon, Sparkles, Ticket } from "lucide-react";
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
  const sections: { eyebrow: string; icon: ReactNode; title: string; events: EventSummary[] }[] = [
    { eyebrow: "À ne pas manquer", icon: <Flame size={15} />, title: "Les incontournables", events: rails.incontournables },
    { eyebrow: "Entrée libre", icon: <Ticket size={15} />, title: "Sortir gratuitement", events: rails.gratuit },
    { eyebrow: "Après 17 heures", icon: <Moon size={15} />, title: "Pour ce soir", events: rails.ceSoir },
    { eyebrow: "En plein air", icon: <Leaf size={15} />, title: "Dehors aujourd’hui", events: rails.pleinAir },
    { eyebrow: "Idéal pour un date", icon: <Heart size={15} />, title: "À deux ce soir", events: rails.date },
    { eyebrow: "Dernier jour", icon: <Hourglass size={15} />, title: "C’est maintenant ou jamais", events: rails.dernierJour },
    { eyebrow: "Insolite", icon: <Sparkles size={15} />, title: "Sortir des sentiers battus", events: rails.insolite },
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

      <section className="today-section shell-pad">
        <div className="mx-auto max-w-[88rem]">
          <div className="section-heading">
            <div><p className="eyebrow">À portée de métro</p><h2>Les sorties du jour</h2></div>
            <Link href="/decouvrir?periode=TODAY">Voir sur la carte <ArrowRight size={17} /></Link>
          </div>
          <EventGrid events={events.slice(0, 9)} emptyMessage={unavailable ? "Le service de sorties ne répond pas pour le moment." : "Aucun événement n’est publié pour aujourd’hui."} />
        </div>
      </section>

      {sections.map((section, index) => (
        <section key={section.eyebrow} className={`today-section${index % 2 === 0 ? " alternate" : ""} shell-pad`}>
          <div className="mx-auto max-w-[88rem]">
            <div className="section-heading"><div><p className="eyebrow">{section.icon} {section.eyebrow}</p><h2>{section.title}</h2></div></div>
            <EventGrid events={section.events} />
          </div>
        </section>
      ))}
    </>
  );
}
