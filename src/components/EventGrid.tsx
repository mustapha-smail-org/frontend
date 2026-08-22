import { CalendarX2 } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import type { EventSummary } from "@/lib/types";

export function EventGrid({ events, emptyMessage = "Aucune sortie ne correspond à ces critères." }: { events: EventSummary[]; emptyMessage?: string }) {
  if (!events.length) return <div className="empty-state"><CalendarX2 aria-hidden="true"/><h2>Rien à afficher pour le moment</h2><p>{emptyMessage}</p></div>;
  return <div className="event-grid">{events.map((event, index) => <EventCard key={event.id} event={event} priority={index < 3} />)}</div>;
}
