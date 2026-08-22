"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, MessageSquare, Send, X } from "lucide-react";
import { submitFeedback } from "@/lib/api";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false); const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); setState("sending");
    try { await submitFeedback({ type: String(form.get("type")), message: String(form.get("message")), email: String(form.get("email") || "") || undefined }); formElement.reset(); setState("sent"); }
    catch { setState("error"); }
  }
  return <div className="feedback-widget">
    {open && <div className="feedback-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <button className="dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X/></button>
      {state === "sent" ? <div className="feedback-success"><CheckCircle2/><h2 id="feedback-title">Merci pour votre retour</h2><p>Votre message a bien été enregistré.</p><button onClick={() => { setState("idle"); setOpen(false); }}>Fermer</button></div> : <form onSubmit={submit}><p className="eyebrow">Votre avis compte</p><h2 id="feedback-title">Aidez-nous à améliorer Paname Spot</h2><label>Nature du retour<select name="type" defaultValue="GENERAL"><option value="GENERAL">Suggestion</option><option value="BUG">Problème rencontré</option><option value="CONTENT">Contenu incorrect</option></select></label><label>Votre message<textarea name="message" rows={4} minLength={5} maxLength={2000} required placeholder="Dites-nous ce qui serait plus utile…"/></label><label>E-mail <span>(facultatif)</span><input name="email" type="email" autoComplete="email"/></label><button className="form-submit" disabled={state === "sending"}><Send size={17}/>{state === "sending" ? "Envoi…" : "Envoyer"}</button>{state === "error" && <p className="form-error" role="alert">L’envoi a échoué. Réessayez dans un instant.</p>}</form>}
    </div>}
    <button className="feedback-trigger" type="button" onClick={() => setOpen(!open)} aria-expanded={open}><MessageSquare size={18}/><span>Votre avis</span></button>
  </div>;
}
