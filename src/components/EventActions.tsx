"use client";

import { useState } from "react";
import { Check, ExternalLink, Share2, Ticket } from "lucide-react";

export function EventActions({ title, bookingUrl, bookingLabel, officialUrl = null }: { title: string; bookingUrl: string | null; bookingLabel: string | null; officialUrl?: string | null }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const payload = { title, text: `Découvrez ${title} sur Paname Spot`, url: window.location.href };
    if (navigator.share) await navigator.share(payload);
    else { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  }
  // Primary action: real booking link if the source provides one, otherwise the
  // official page. Nothing invented — the button is hidden when neither exists.
  const primary = bookingUrl
    ? { href: bookingUrl, label: bookingLabel || "Réserver", booking: true }
    : officialUrl
      ? { href: officialUrl, label: "Site officiel", booking: false }
      : null;
  return (
    <div className="event-actions">
      {primary && (
        <a href={primary.href} target="_blank" rel="noopener noreferrer">
          {primary.booking ? <Ticket size={18} /> : <ExternalLink size={18} />}{primary.label}
        </a>
      )}
      <button type="button" onClick={() => void share()}>
        {copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? "Lien copié" : "Partager"}
      </button>
    </div>
  );
}
