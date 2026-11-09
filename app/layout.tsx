import type { Metadata } from "next";
import { Archivo, Fugaz_One } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  jsonLdSite,
} from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE} : lois, votes et élus`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  formatDetection: { telephone: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION
            ? { google: process.env.GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(process.env.BING_SITE_VERIFICATION
            ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
            : {}),
        },
      }
    : {}),
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
        <JsonLd data={jsonLdSite()} />
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
