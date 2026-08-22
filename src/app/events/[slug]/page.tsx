import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accessibility, ArrowLeft, CalendarDays, ExternalLink, Eye, Ear, ImageOff, MapPin, Navigation, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EventActions } from "@/components/EventActions";
import { EventGrid } from "@/components/EventGrid";
import { EventMapPanel } from "@/components/EventMapPanel";
import { ReportForm } from "@/components/ReportForm";
import { ApiError, getEventBySlug, getEvents } from "@/lib/api";
import { cleanRichText, plainText, safeExternalUrl } from "@/lib/content";
import { arrondissementLabel, formatDateRange, formatSchedule, priceLabel } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

type PageProps = { params: Promise<{ slug: string }> };
async function loadEvent(slug: string) { try { return await getEventBySlug(slug); } catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params; const event = await loadEvent(slug); const description = plainText(event.leadText || event.description, event.title).slice(0, 156);
  return { title: event.title, description, alternates: { canonical: `/events/${event.slug}` }, openGraph: { title: event.title, description, type: "article", url: `/events/${event.slug}`, images: event.imageUrl ? [{ url: event.imageUrl, alt: event.imageAlt || event.title }] : [] }, twitter: { card: event.imageUrl ? "summary_large_image" : "summary", title: event.title, description, images: event.imageUrl ? [event.imageUrl] : [] } };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params; const event = await loadEvent(slug); const location = event.location;
  const description = cleanRichText(event.description); const lead = plainText(event.leadText); const dateDetails = cleanRichText(event.dateDescription);
  const bookingUrl = safeExternalUrl(event.pricing?.bookingUrl); const officialUrl = safeExternalUrl(event.officialUrl);
  let related: EventSummary[] = [];
  try { related = (await getEvents({ category: event.categories[0], limit: 4 })).items.filter((item) => item.id !== event.id).slice(0, 3); } catch { /* Related content is optional. */ }
  const address = [location?.street, location?.zipcode, location?.city].filter(Boolean).join(", ");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://panamespot.fr";
  const jsonLd = { "@context": "https://schema.org", "@type": "Event", name: event.title, description: plainText(event.description, event.title), startDate: event.startAt, endDate: event.endAt, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", image: event.imageUrl ? [event.imageUrl] : undefined, url: `${siteUrl}/events/${event.slug}`, isAccessibleForFree: event.pricing?.type === "FREE", location: location ? { "@type": "Place", name: location.name, address: { "@type": "PostalAddress", streetAddress: location.street, postalCode: location.zipcode, addressLocality: location.city || "Paris", addressCountry: "FR" }, geo: location.latitude != null && location.longitude != null ? { "@type": "GeoCoordinates", latitude: location.latitude, longitude: location.longitude } : undefined } : undefined, offers: bookingUrl ? { "@type": "Offer", url: bookingUrl, availability: "https://schema.org/InStock" } : undefined };
  const accessibility = event.accessibility;
  return <article>
    <section className="event-hero">
      {event.imageUrl ? <Image src={event.imageUrl} alt={event.imageAlt || event.title} fill priority sizes="100vw" className="object-cover"/> : <div className="image-missing"><ImageOff/><span>Visuel non fourni par la source</span></div>}
      <div className="event-hero-scrim"/><div className="event-hero-inner shell-pad"><div className="mx-auto max-w-[88rem]"><Link className="event-back" href="/decouvrir"><ArrowLeft size={17}/>Retour aux sorties</Link><div className="event-hero-copy"><div className="event-tags"><span>{event.categories[0] || "Sortie"}</span><span>{priceLabel(event.pricing?.type)}</span></div><p className="event-hero-date">{formatSchedule({ ...event, scheduleLabel: null })}</p><h1>{event.title}</h1>{lead && <p>{lead}</p>}<div className="event-hero-place"><MapPin size={17}/>{location?.name || arrondissementLabel(location?.arrondissement)}</div><EventActions title={event.title} bookingUrl={bookingUrl} bookingLabel={event.pricing?.bookingLinkText || null} officialUrl={officialUrl}/></div></div></div>
      {event.imageCredit && <small className="image-credit">{event.imageCredit}</small>}
    </section>
    <div className="event-layout shell-pad"><div className="mx-auto grid max-w-[88rem] gap-12 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="event-main">
        <section><p className="eyebrow">L’événement</p><h2>À propos</h2>{description ? <div className="rich-text" dangerouslySetInnerHTML={{ __html: description }}/> : <p className="muted-copy">La source officielle ne fournit pas encore de description détaillée.</p>}</section>
        {(event.occurrences.length > 0 || dateDetails) && <section><p className="eyebrow">Dates et horaires</p><h2>Quand venir ?</h2>{dateDetails && <div className="rich-text compact" dangerouslySetInnerHTML={{ __html: dateDetails }}/>} {event.occurrences.length > 0 && <ul className="occurrences">{event.occurrences.slice(0, 12).map((item, index) => <li key={`${item.start}-${index}`}><CalendarDays/><span>{formatDateRange(item.start, item.end)}</span></li>)}</ul>}</section>}
        {(event.transport || accessibility) && <section><p className="eyebrow">Sur place</p><h2>Accès et accueil</h2>{event.transport && <div className="practical-line"><Navigation/><div><strong>Transports</strong><div className="rich-text compact" dangerouslySetInnerHTML={{ __html: cleanRichText(event.transport) }}/></div></div>}{accessibility && <div className="accessibility-grid"><AccessibilityItem icon={Accessibility} label="Accès fauteuil" value={accessibility.wheelchairAccessible}/><AccessibilityItem icon={Eye} label="Accueil déficience visuelle" value={accessibility.blindAccessible}/><AccessibilityItem icon={Ear} label="Accueil déficience auditive" value={accessibility.deafAccessible}/>{accessibility.signLanguage && <AccessibilityItem icon={Accessibility} label="Langue des signes" text={accessibility.signLanguage}/>}</div>}</section>}
      </div>
      <aside className="event-sidebar"><div className="practical-panel"><h2>Infos pratiques</h2><dl><div><dt><CalendarDays/>Date</dt><dd>{formatSchedule({ ...event, scheduleLabel: null })}</dd></div><div><dt><MapPin/>Lieu</dt><dd><strong>{location?.name || "Paris"}</strong>{address && <span>{address}</span>}</dd></div><div><dt><Ticket/>Tarif</dt><dd>{event.pricing?.detail ? plainText(event.pricing.detail) : priceLabel(event.pricing?.type)}</dd></div></dl>{location?.latitude != null && location.longitude != null && <><EventMapPanel latitude={location.latitude} longitude={location.longitude}/><a className="map-link" href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`} target="_blank" rel="noopener noreferrer">Ouvrir l’itinéraire <ExternalLink size={14}/></a></>} {officialUrl && <a className="source-link" href={officialUrl} target="_blank" rel="noopener noreferrer">Voir la fiche officielle <ExternalLink size={15}/></a>}</div><p className="source-note">Informations issues de Paris Open Data{event.sourceUpdatedAt ? `, mises à jour le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(event.sourceUpdatedAt))}` : ""}.</p><ReportForm slug={event.slug}/></aside>
    </div></div>
    {related.length > 0 && <section className="event-related shell-pad"><div className="mx-auto max-w-[88rem]"><div className="section-heading compact"><div><p className="eyebrow">Dans le même esprit</p><h2>À découvrir aussi</h2></div></div><EventGrid events={related}/></div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
  </article>;
}

function AccessibilityItem({ icon: Icon, label, value, text }: { icon: LucideIcon; label: string; value?: boolean | null; text?: string }) {
  if (value == null && !text) return null;
  return <div><Icon/><span><strong>{label}</strong><small>{text || (value ? "Oui" : "Non")}</small></span></div>;
}
