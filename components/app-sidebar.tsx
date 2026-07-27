"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ClerkAuthControls } from "@/components/clerk-auth-controls";
import { FlagFr } from "@/components/flag-fr";
import { NAV_ICON_BY_HREF } from "@/components/nav-icons";
import { useTheme } from "@/components/theme-provider";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/actualite", label: "À l'Assemblée" },
  { href: "/dossiers", label: "Lois" },
  { href: "/scrutins", label: "Votes" },
  { href: "/deputes", label: "Députés" },
  { href: "/senateurs", label: "Sénateurs" },
  { href: "/groupes", label: "Groupes" },
  { href: "/comparateur", label: "Comparateur" },
  { href: "/boussole", label: "Boussole" },
  { href: "/philosophies", label: "Philosophies" },
  { href: "/methodologie", label: "Méthodologie" },
] as const;

const SIDEBAR_KEY = "phronesis.sidebar";
const sidebarListeners = new Set<() => void>();

function emitSidebar(): void {
  for (const listener of sidebarListeners) listener();
}

function readCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_KEY) === "1";
}

function subscribeCollapsed(onStoreChange: () => void): () => void {
  sidebarListeners.add(onStoreChange);
  return () => {
    sidebarListeners.delete(onStoreChange);
  };
}

export function AppSidebar(): React.ReactElement {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    (): boolean => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const widthClass = collapsed ? "w-[4.5rem]" : "w-56";
  const showLabels = !collapsed || mobileOpen;

  useLayoutEffect(() => {
    const w = collapsed ? "4.5rem" : "14rem";
    document.documentElement.style.setProperty("--sidebar-width", w);
  }, [collapsed]);

  function persistCollapse(next: boolean): void {
    localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    emitSidebar();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0 overflow-y-auto px-1 py-2">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = NAV_ICON_BY_HREF[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            onClick={() => setMobileOpen(false)}
            className={
              `flex min-h-10 items-center gap-2 px-2 text-sm ` +
              `transition-colors ` +
              (collapsed && !mobileOpen ? "justify-center px-0" : "") +
              " " +
              (active
                ? "bg-[var(--sidebar-active)] text-[var(--accent-ink)]"
                : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]")
            }
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {showLabels ? (
              <span className="truncate">{item.label}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div
      className={
        "mt-auto space-y-1 border-t border-[var(--sidebar-border)] p-2"
      }
    >
      <button
        type="button"
        onClick={toggle}
        className={
          "flex min-h-10 w-full items-center gap-2 px-2 text-left " +
          "text-sm text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] " +
          (collapsed && !mobileOpen ? "justify-center px-0" : "")
        }
        title="Thème"
      >
        <span className="num w-4 shrink-0 text-center text-xs text-[var(--accent)]">
          {theme === "dark" ? "D" : "L"}
        </span>
        {showLabels && (
          <span>{theme === "dark" ? "Thème sombre" : "Thème clair"}</span>
        )}
      </button>

      {HAS_CLERK ? (
        <ClerkAuthControls collapsed={collapsed} mobileOpen={mobileOpen} />
      ) : (
        <div className="flex min-h-10 items-center px-1">
          <Link
            href="/sign-in"
            className={
              "flex min-h-10 w-full items-center justify-center " +
              "border border-[var(--accent)]/40 px-2 text-xs " +
              "font-medium text-[var(--accent-ink)] " +
              "hover:bg-[var(--sidebar-hover)]"
            }
          >
            {showLabels ? "Se connecter" : "→"}
          </Link>
        </div>
      )}

      {showLabels && (
        <p
          className={
            "flex items-center gap-1.5 px-1 text-[10px] " +
            "leading-snug text-[var(--sidebar-muted)]"
          }
        >
          <FlagFr className="h-2 w-3 shrink-0 opacity-70" />
          <span>Données publiques · France</span>
        </p>
      )}
    </div>
  );

  const logoBlock = (
    <Link
      href="/"
      onClick={() => setMobileOpen(false)}
      className={
        "flex flex-col items-center justify-center text-center " +
        (showLabels ? "px-2 py-4" : "px-1 py-3")
      }
    >
      <p
        className={
          `font-[family-name:var(--font-logo)] tracking-wide ` +
          `text-[var(--accent-ink)] ` +
          (showLabels ? "text-lg" : "text-[10px] leading-tight")
        }
      >
        {showLabels ? "PHRONESIS" : "PH"}
      </p>
      {showLabels && (
        <p className="mt-1 text-[10px] text-[var(--sidebar-muted)]">
          Comprendre avant de juger
        </p>
      )}
    </Link>
  );

  const panel = (
    <div
      className={
        "flex h-full flex-col border-r border-[var(--sidebar-border)] " +
        "bg-[var(--sidebar)] text-[var(--sidebar-fg)]"
      }
    >
      <div className="relative border-b border-[var(--sidebar-border)]">
        {logoBlock}
        <button
          type="button"
          className={
            "absolute right-0 top-0 hidden min-h-8 min-w-8 items-center " +
            "justify-center text-[var(--sidebar-muted)] " +
            "hover:bg-[var(--sidebar-hover)] md:inline-flex"
          }
          onClick={() => persistCollapse(!collapsed)}
          aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      {nav}
      {footer}
    </div>
  );

  return (
    <>
      <aside
        className={
          `fixed left-0 top-0 z-50 hidden h-screen overflow-hidden ` +
          `transition-[width] duration-300 ease-out md:block ${widthClass}`
        }
      >
        {panel}
      </aside>

      <div
        className={
          "fixed inset-x-0 top-0 z-50 flex h-11 items-center " +
          "justify-between border-b border-[var(--sidebar-border)] " +
          "bg-[var(--sidebar)] px-3 md:hidden"
        }
      >
        <button
          type="button"
          className="min-h-10 min-w-10 text-[var(--sidebar-fg)]"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>
        <Link
          href="/"
          className="font-[family-name:var(--font-logo)] text-base text-[var(--accent-ink)]"
        >
          PHRONESIS
        </Link>
        <div className="w-10" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-56 max-w-[85vw] shadow-xl">
            {panel}
          </div>
        </div>
      ) : null}
    </>
  );
}
