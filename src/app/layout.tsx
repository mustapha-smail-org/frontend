import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { Analytics } from "@/components/Analytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@/theme/paname-spot.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", weight: ["400", "500", "600", "700"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["400", "500", "600", "700"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://panamespot.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Paname Spot - sorties et événements à Paris",
    template: "%s | Paname Spot",
  },
  description:
    "Paname Spot rassemble concerts, expositions, spectacles et idées de sortie à Paris, sans compte et en français.",
  applicationName: "Paname Spot",
  category: "culture et loisirs",
  keywords: ["sorties Paris", "événements Paris", "que faire à Paris", "expositions Paris", "concerts Paris"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Paname Spot",
    title: "Paname Spot - Paris se découvre ici",
    description:
      "Le guide simple et visuel pour trouver quoi faire à Paris aujourd'hui.",
    url: siteUrl,
  },
  twitter: { card: "summary", title: "Paname Spot - Paris se découvre ici", description: "Trouvez quoi faire à Paris aujourd’hui." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('ps-theme');if(m==='light'||m==='dark'){document.documentElement.setAttribute('data-theme',m);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <CookieConsentBanner />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
