import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff, MapPin } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { arrondissementLabel, formatSchedule, priceLabel } from "@/lib/format";

export function HeroEvent({ event }: { event: EventSummary }) {
  return (
    <section className="home-hero shell-pad">
      <div className="mx-auto grid max-w-[88rem] items-stretch lg:grid-cols-[0.82fr_1.18fr]">
        <div className="hero-copy"><p className="eyebrow">Le guide vivant de Paris</p><h1>Paris,<br/><em>au bon endroit.</em></h1><p className="hero-intro">Des idées de sorties claires, actuelles et proches de vous. Sans compte, sans détour.</p><div className="hero-actions"><Link href="/decouvrir">Explorer les sorties <ArrowRight size={18}/></Link><Link href="/aujourdhui">Que faire aujourd’hui ?</Link></div></div>
        <Link href={`/events/${event.slug}`} className="hero-event">
          {event.imageUrl ? <Image src={event.imageUrl} alt={event.imageAlt || event.title} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover"/> : <div className="image-missing"><ImageOff/><span>Visuel non fourni par la source</span></div>}
          <div className="hero-event-scrim"/><div className="hero-event-content"><div><span>{priceLabel(event.pricing)}</span><span><MapPin size={13}/>{arrondissementLabel(event.arrondissement)}</span></div><p>{formatSchedule(event)}</p><h2>{event.title}</h2><small>{event.venue || event.categories[0] || "Paris"}</small></div>
        </Link>
      </div>
    </section>
  );
}
