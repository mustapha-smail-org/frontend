import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SiteNavigation } from "@/components/SiteNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header className="site-header">
        <div className="shell-pad mx-auto flex h-[4.5rem] max-w-[88rem] items-center justify-between gap-5">
          <BrandMark /><SiteNavigation />
          <div className="flex items-center gap-2.5">
            <Link href="/decouvrir" className="header-search" aria-label="Rechercher une sortie"><Search size={19} aria-hidden="true" /><span>Rechercher</span></Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="contenu">{children}</main>
      <FeedbackWidget /><SiteNavigation mobile />
      <footer className="site-footer shell-pad">
        <div className="mx-auto grid max-w-[88rem] gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div><BrandMark inverse /><p className="mt-5 max-w-sm text-sm leading-6 text-white/65">Les événements de Paris, lisibles sans compte et mis à jour depuis les données publiques de la Ville.</p></div>
          <div><p className="footer-title">Explorer</p><Link href="/aujourdhui">Aujourd’hui</Link><Link href="/decouvrir">Toutes les sorties</Link></div>
          <div><p className="footer-title">À propos</p><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/conditions-generales">Conditions générales</Link><Link href="/cookies">Cookies</Link><p className="mt-4 text-xs text-white/45">Source : Paris Open Data</p></div>
        </div>
      </footer>
    </div>
  );
}
