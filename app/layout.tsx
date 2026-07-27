import type { Metadata } from "next";
import {
  Fraunces,
  Fugaz_One,
  JetBrains_Mono,
  Source_Sans_3,
} from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Providers } from "@/components/providers";

import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const logo = Fugaz_One({
  variable: "--font-logo",
  weight: "400",
  subsets: ["latin"],
});

const num = JetBrains_Mono({
  variable: "--font-num",
  subsets: ["latin"],
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
      className={
        `${display.variable} ${body.variable} ${logo.variable} ` +
        `${num.variable} h-full antialiased`
      }
    >
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
        <Providers>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col pt-11 md:ml-[var(--sidebar-width)] md:pt-0 md:transition-[margin] md:duration-300">
              <AppTopbar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
