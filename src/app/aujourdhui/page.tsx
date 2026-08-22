import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Moon, Palette, Sparkles, Ticket } from "lucide-react";
import { EventGrid } from "@/components/EventGrid";
import { getEvents } from "@/lib/api";
import type { EventSummary } from "@/lib/types";

export const metadata: Metadata = {
  title: "Que faire aujourd’hui à Paris",
  description: "Les événements ouverts et les sorties à faire aujourd’hui à Paris, avec leurs horaires à venir.",
  alternates: { canonical: "/aujourdhui" },
};

// Honest, rule-based grouping only. Real editorial curation (incontournables,
// pépites, moods) arrives with the AI-enrichment backend — see the WIP notice.
const CULTURE = /(expo|mus[ée]e|th[ée][âa]tre|galerie|cin[ée]ma|danse|spectacle|art|lecture|conf[ée]rence|opéra|opera)/i;

export default async function TodayPage() {
  let events: EventSummary[] = [];
  let unavailable = false;
  try { events = (await getEvents({ period: "TODAY", limit: 40 })).items; } catch { unavailable = true; }

  const free = events.filter((event) => event.pricing === "FREE").slice(0, 8);
  const parisHour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Paris" });
  const evening = events
    .filter((event) => { const date = event.displayStartAt ? new Date(event.displayStartAt) : null; return date && Number(parisHour.format(date)) >= 17; })
    .slice(0, 8);
  const culture = events.filter((event) => event.categories.some((category) => CULTURE.test(category))).slice(0, 6);

  return (
    <>
      <section className="today-hero shell-pad">
        <div className="mx-auto max-w-[88rem]">
          <p className="eyebrow"><Clock3 size={16} /> Mis à jour aujourd’hui</p>
          <h1>Paris aujourd’hui,<br /><em>sans perdre une minute.</em></h1>
          <p>Les expositions, concerts, spectacles et rendez-vous accessibles ce jour.</p>
        </div>
      </section>

      <section className="shell-pad">
        <div className="mx-auto max-w-[88rem]">
          <div className="today-wip" role="note">
            <Sparkles size={20} aria-hidden="true" />
            <div>
              <strong>Sélection en cours d’amélioration <span className="wip-chip">Bientôt</span></strong>
              <p>Pour l’instant, on affiche simplement ce qui se passe aujourd’hui, sans tri éditorial. Bientôt, Paname Spot mettra en avant les incontournables et les pépites du jour.</p>
            </div>
          </div>
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

      {!!free.length && (
        <section className="today-section alternate shell-pad">
          <div className="mx-auto max-w-[88rem]">
            <div className="section-heading"><div><p className="eyebrow"><Ticket size={15} /> Entrée libre</p><h2>Sortir gratuitement</h2></div></div>
            <EventGrid events={free} />
          </div>
        </section>
      )}

      {!!evening.length && (
        <section className="today-section shell-pad">
          <div className="mx-auto max-w-[88rem]">
            <div className="section-heading"><div><p className="eyebrow"><Moon size={15} /> Après 17 heures</p><h2>Pour ce soir</h2></div></div>
            <EventGrid events={evening} />
          </div>
        </section>
      )}

      {!!culture.length && (
        <section className="today-section alternate shell-pad">
          <div className="mx-auto max-w-[88rem]">
            <div className="section-heading"><div><p className="eyebrow"><Palette size={15} /> Expos, scènes &amp; musées</p><h2>Culture aujourd’hui</h2></div></div>
            <EventGrid events={culture} />
          </div>
        </section>
      )}
    </>
  );
}
