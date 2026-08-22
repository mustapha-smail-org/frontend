"use client";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="shell-pad grid min-h-[65vh] place-items-center py-16 text-center"><div className="max-w-lg"><p className="eyebrow justify-center">Service indisponible</p><h1 className="text-4xl font-extrabold text-[var(--midnight)]">Paris est toujours là.<br/>Nos données reviennent bientôt.</h1><p className="mt-5 text-[var(--muted)]">La connexion au catalogue d’événements a échoué. Aucun faux contenu n’est affiché à la place.</p><button onClick={reset} className="mt-7 inline-flex items-center gap-2 bg-[var(--midnight)] px-4 py-3 text-sm font-bold text-white"><RefreshCw size={17}/>Réessayer</button></div></section>;
}
