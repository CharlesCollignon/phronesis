import type { Metadata } from "next";
import { Archivo, Fugaz_One } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const fontSans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontLogo = Fugaz_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: {
    default: "Phronesis — Comprendre avant de juger",
    template: "%s · Phronesis",
  },
  description:
    "Plateforme d'éducation civique : lois, votes nominatifs et " +
    "données publiques de l'Assemblée nationale, pour former son " +
    "propre jugement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontLogo.variable, "h-full")}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <a
                href="#contenu"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-black"
              >
                Aller au contenu
              </a>
              <SiteHeader />
              <main id="contenu" className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
          </TooltipProvider>
        </Providers>
      </body>
      <Analytics />
    </html>
  );
}
