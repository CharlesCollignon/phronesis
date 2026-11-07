"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";

import { ClerkAuthControls } from "@/components/clerk-auth-controls";
import { NotificationsBell } from "@/components/notifications-bell";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

type NavItem = {
  href: string;
  label: string;
  /** Préfixes de chemin qui rendent l'entrée active. */
  match: string[];
};

export const NAV: NavItem[] = [
  { href: "/actualite", label: "À l'Assemblée", match: ["/actualite"] },
  { href: "/dossiers", label: "Lois", match: ["/dossiers"] },
  { href: "/scrutins", label: "Votes", match: ["/scrutins"] },
  {
    href: "/deputes",
    label: "Élus",
    match: ["/deputes", "/senateurs"],
  },
  { href: "/groupes", label: "Groupes", match: ["/groupes"] },
  { href: "/comparateur", label: "Comparateur", match: ["/comparateur"] },
  { href: "/boussole", label: "Boussole", match: ["/boussole"] },
];

function isActive(item: NavItem, pathname: string): boolean {
  return item.match.some((m) => pathname.startsWith(m));
}

/** Libellé doublé pour l'effet de roulement au survol. */
function Roll({ children }: { children: string }): React.ReactElement {
  return (
    <span className="roll">
      <span>
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </span>
  );
}

/** En-tête noir : logo jaune, navigation, recherche, compte. */
export function SiteHeader(): React.ReactElement {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  // Ferme le menu mobile à chaque navigation, sans effet : on
  // mémorise le chemin pour lequel il a été ouvert.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = open && openedAt === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const searchActive = pathname.startsWith("/recherche");

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] text-white">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="font-[family-name:var(--font-logo)] text-[22px] uppercase tracking-[0.03em] text-[var(--logo)]"
        >
          Phronesis
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-6 text-[15px] lg:flex"
        >
          {NAV.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative transition-colors",
                  "after:absolute after:inset-x-0 after:-bottom-[22px] after:h-0.5",
                  "after:origin-left after:bg-[var(--accent)]",
                  "after:transition-transform after:duration-500 after:ease-[var(--spring)]",
                  active
                    ? "text-white after:scale-x-100"
                    : "text-[#c4c4c4] after:scale-x-0 hover:text-white",
                )}
              >
                <Roll>{item.label}</Roll>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/recherche"
            aria-label="Rechercher"
            aria-current={searchActive ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center border transition-colors",
              searchActive
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[#3a3a3a] text-[#d4d4d4] hover:border-white hover:text-white",
            )}
          >
            <Search className="size-4" aria-hidden />
          </Link>
          <NotificationsBell />
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === "dark"
                ? "Passer au thème clair"
                : "Passer au thème sombre"
            }
            className="hidden size-9 items-center justify-center text-[#d4d4d4] transition-colors hover:text-white sm:inline-flex"
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </button>
          <div className="hidden sm:block">
            {HAS_CLERK ? (
              <ClerkAuthControls />
            ) : (
              <Link
                href="/sign-in"
                className="ml-2 text-[15px] text-[#c4c4c4] transition-colors hover:text-white"
              >
                <Roll>Connexion</Roll>
              </Link>
            )}
          </div>
          <button
            type="button"
            className="ml-1 inline-flex h-11 items-center text-[15px] font-medium lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => {
              setOpen(!menuOpen);
              setOpenedAt(pathname);
            }}
          >
            {menuOpen ? "Fermer" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 bg-[#0a0a0a] px-5 pb-8 sm:px-8 lg:hidden",
          "transition-[clip-path] duration-700 ease-[var(--spring)]",
          menuOpen
            ? "[clip-path:inset(0_0_0_0)]"
            : "pointer-events-none [clip-path:inset(0_0_100%_0)]",
        )}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Menu mobile" className="flex flex-col pt-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={menuOpen ? undefined : -1}
              className={cn(
                "border-t border-[#262626] py-4 text-2xl font-medium",
                isActive(item, pathname) ? "text-[var(--accent)]" : "text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between border-t border-[#262626] pt-5">
            {HAS_CLERK ? (
              <ClerkAuthControls />
            ) : (
              <Link
                href="/sign-in"
                tabIndex={menuOpen ? undefined : -1}
                className="text-lg text-white"
              >
                Connexion
              </Link>
            )}
            <button
              type="button"
              onClick={toggle}
              tabIndex={menuOpen ? undefined : -1}
              className="text-base text-[#c4c4c4]"
            >
              {theme === "dark" ? "Thème clair" : "Thème sombre"}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
