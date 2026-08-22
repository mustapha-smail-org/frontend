"use client";

import Link from "next/link";
import { CalendarDays, Compass, House } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "À la une", icon: House },
  { href: "/aujourdhui", label: "Aujourd’hui", icon: CalendarDays },
  { href: "/decouvrir", label: "Découvrir", icon: Compass },
];

export function SiteNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className={mobile ? "mobile-nav" : "desktop-nav"}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} data-active={active}>
            {mobile && <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.5 : 1.8} />}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
