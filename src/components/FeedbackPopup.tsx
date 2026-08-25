"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Send, X } from "lucide-react";
import { submitFeedback } from "@/lib/api";
import {
  canShow,
  cooldownUntil,
  eventDetailSlug,
  exitTriggerReady,
  feedbackPopupConfig as config,
  primaryTriggerReady,
} from "@/lib/feedbackPopup";

const SESSION_SHOWN_KEY = "ps-feedback-popup-shown";
const COOLDOWN_KEY = "ps-feedback-popup-until";

/**
 * Exit-intent + engagement feedback popup. Behaviour is entirely driven by
 * `feedbackPopupConfig`; this component only wires browser triggers to the pure
 * decision helpers in `@/lib/feedbackPopup`. Suggestion-only, so it reuses
 * POST /api/feedback (no backend change).
 */
export function FeedbackPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const openedRef = useRef(false);
  const dwellReachedRef = useRef(false);
  const viewedSlugsRef = useRef<Set<string>>(new Set());

  const eligible = useCallback(() => canShow({
    pathname,
    alreadyOpened: openedRef.current,
    sessionShown: Boolean(sessionStorage.getItem(SESSION_SHOWN_KEY)),
    cooldownUntil: Number(localStorage.getItem(COOLDOWN_KEY) ?? 0),
    now: Date.now(),
  }), [pathname]);

  const reveal = useCallback(() => {
    if (!eligible()) return;
    openedRef.current = true;
    setOpen(true);
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    localStorage.setItem(COOLDOWN_KEY, String(cooldownUntil(Date.now())));
  }, [eligible]);

  const tryPrimary = useCallback(() => {
    if (primaryTriggerReady({ dwellReached: dwellReachedRef.current, eventsViewed: viewedSlugsRef.current.size })) reveal();
  }, [reveal]);

  // Count distinct event-detail pages seen (persists across client navigations
  // because this component lives in AppShell and never unmounts).
  useEffect(() => {
    const track = () => {
      const slug = eventDetailSlug(pathname);
      if (slug) viewedSlugsRef.current.add(slug);
      tryPrimary();
    };
    track();
  }, [pathname, tryPrimary]);

  // Primary trigger: dwell time on site.
  useEffect(() => {
    const id = setTimeout(() => { dwellReachedRef.current = true; tryPrimary(); }, config.triggers.minDwellSeconds * 1000);
    return () => clearTimeout(id);
  }, [tryPrimary]);

  // Fallback trigger: exit intent (pointer leaves through the top edge).
  useEffect(() => {
    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget && exitTriggerReady({ eventsViewed: viewedSlugsRef.current.size })) reveal();
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [reveal]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setState("sending");
    try {
      await submitFeedback({ type: "GENERAL", message: String(form.get("message")), email: String(form.get("email") || "") || undefined });
      formElement.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (!open) return null;

  return (
    <div className="feedback-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-popup-title">
      <div className="feedback-modal">
        <button className="dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X /></button>
        {state === "sent" ? (
          <div className="feedback-success">
            <CheckCircle2 />
            <h2 id="feedback-popup-title">Merci pour votre retour</h2>
            <p>{config.copy.successText}</p>
            <button type="button" onClick={() => setOpen(false)}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="eyebrow">Votre avis compte</p>
            <h2 id="feedback-popup-title">{config.copy.title}</h2>
            <p className="feedback-modal-prompt">{config.copy.prompt}</p>
            <label>Votre suggestion
              <textarea name="message" rows={4} minLength={5} maxLength={2000} required placeholder={config.copy.placeholder} />
            </label>
            <label>E-mail <span>(facultatif)</span>
              <input name="email" type="email" autoComplete="email" />
            </label>
            <button className="form-submit" disabled={state === "sending"}>
              <Send size={17} />{state === "sending" ? "Envoi…" : config.copy.submitLabel}
            </button>
            {state === "error" && <p className="form-error" role="alert">L’envoi a échoué. Réessayez dans un instant.</p>}
            <button type="button" className="feedback-modal-dismiss" onClick={() => setOpen(false)}>{config.copy.dismissLabel}</button>
          </form>
        )}
      </div>
    </div>
  );
}
