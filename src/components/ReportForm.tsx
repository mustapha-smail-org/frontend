"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { reportEvent } from "@/lib/api";

export function ReportForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); setState("sending");
    try { await reportEvent(slug, { type: String(form.get("type")), message: String(form.get("message") || ""), email: String(form.get("email") || "") || undefined }); formElement.reset(); setState("sent"); }
    catch { setState("error"); }
  }
  if (state === "sent") return <div className="report-success"><CheckCircle2/><strong>Signalement enregistré</strong><p>Merci, l’information sera vérifiée.</p></div>;
  return <details className="report-form"><summary><AlertTriangle size={16}/>Signaler une information incorrecte</summary><form onSubmit={submit}><label>Problème<select name="type" defaultValue="INCORRECT_INFORMATION"><option value="INCORRECT_INFORMATION">Information incorrecte</option><option value="EVENT_CANCELLED">Événement annulé</option><option value="BROKEN_LINK">Lien inaccessible</option><option value="INAPPROPRIATE_CONTENT">Contenu inadapté</option></select></label><label>Précisions<textarea name="message" rows={3} maxLength={2000}/></label><label>E-mail <span>(facultatif)</span><input name="email" type="email"/></label><button className="form-submit" disabled={state === "sending"}><Send size={16}/>{state === "sending" ? "Envoi…" : "Envoyer"}</button>{state === "error" && <p className="form-error">Impossible d’envoyer le signalement.</p>}</form></details>;
}
