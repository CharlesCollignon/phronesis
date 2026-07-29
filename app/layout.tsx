import type { Metadata } from "next";
import { Fugaz_One, Inter, JetBrains_Mono } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={cn(
        fontSans.variable,
        fontMono.variable,
        fontLogo.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <TooltipProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div
                className={
                  "flex min-w-0 flex-1 flex-col pt-11 " +
                  "md:ml-[var(--sidebar-width)] md:pt-0 " +
                  "md:transition-[margin] md:duration-300"
                }
              >
                <AppTopbar />
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </TooltipProvider>
        </Providers>
      </body>
      <Analytics />
    </html>
  );
}
