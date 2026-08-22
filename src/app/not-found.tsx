import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell-pad grid min-h-[70vh] place-items-center py-16 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--red)]">Introuvable</p>
        <h1 className="display mt-3 text-5xl font-bold text-[var(--midnight)]">Cette sortie n&apos;est plus disponible.</h1>
        <Link href="/decouvrir" className="mt-8 inline-flex rounded-full bg-[var(--midnight)] px-5 py-3 text-sm font-bold text-white">
          Revenir aux sorties
        </Link>
      </div>
    </section>
  );
}
