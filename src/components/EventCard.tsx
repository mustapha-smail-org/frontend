import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageOff, MapPin } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { formatSchedule } from "@/lib/format";
import { displayCategory, highlightFlag } from "@/lib/enrichmentLabels";

/** Prototype grid/list card: image with category badge (top-left) + Gratuit
 *  badge (top-right, when free), a rare standout flag (bottom-left), then title
 *  and two icon meta rows. */
export function EventCard({ event, priority = false, compact = false }: { event: EventSummary; priority?: boolean; compact?: boolean }) {
  const category = displayCategory(event);
  const flag = highlightFlag(event);
  const free = event.pricing === "FREE";
  const place = [event.venue, event.arrondissement ? `${event.arrondissement}e` : null].filter(Boolean).join(" · ") || "Paris";
  return (
    <article className={compact ? "event-card event-card-compact" : "event-card"}>
      <Link href={`/events/${event.slug}`} aria-label={`${event.title}, ${formatSchedule(event)}`}>
        <div className="event-card-media">
          {event.imageUrl
            ? <Image src={event.imageUrl} alt={event.imageAlt || event.title} fill priority={priority} sizes={compact ? "180px" : "(min-width: 1100px) 28vw, (min-width: 640px) 50vw, 100vw"} className="object-cover" />
            : <div className="image-missing"><ImageOff aria-hidden="true" /><span>Visuel non fourni</span></div>}
          {category && <span className="cat-badge">{category}</span>}
          {free && <span className="free-badge">Gratuit</span>}
          {flag && <span className={`highlight-badge highlight-${flag.kind}`}>{flag.label}</span>}
        </div>
        <div className="event-card-body">
          <h2 className="clamp-2">{event.title}</h2>
          <p className="event-meta-row"><CalendarDays size={13} aria-hidden="true" />{formatSchedule(event)}</p>
          <p className="event-meta-row"><MapPin size={13} aria-hidden="true" /><span className="clamp-1">{place}</span></p>
        </div>
      </Link>
    </article>
  );
}
