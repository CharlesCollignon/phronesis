"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeft, PanelLeftClose } from "lucide-react";

import { ClerkAuthControls } from "@/components/clerk-auth-controls";
import { FlagFr } from "@/components/flag-fr";
import { NAV_ICON_BY_HREF } from "@/components/nav-icons";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [todayLabel, setTodayLabel] = useState<string | null>(null);

  const widthClass = collapsed ? "w-[4.5rem]" : "w-56";
  const showLabels = !collapsed;

  useEffect(() => {
    setTodayLabel(
      formatDate(new Date().toISOString().slice(0, 10)),
    );
  }, []);

  useLayoutEffect(() => {
    const w = collapsed ? "4.5rem" : "14rem";
    document.documentElement.style.setProperty("--sidebar-width", w);
  }, [collapsed]);

  function persistCollapse(next: boolean): void {
    localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    emitSidebar();
  }

  function NavLinks({
    labels,
    onNavigate,
  }: {
    labels: boolean;
    onNavigate?: () => void;
  }): React.ReactElement {
    return (
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
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-2 px-2 text-sm",
                "transition-colors",
                !labels && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              {labels ? (
                <span className="truncate">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  function Footer({ labels }: { labels: boolean }): React.ReactElement {
    return (
      <div className="mt-auto space-y-1 border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={toggle}
          className={cn(
            "h-10 w-full justify-start gap-2 rounded-none px-2",
            !labels && "justify-center px-0",
          )}
          title="Thème"
        >
          <span className="num w-4 shrink-0 text-center text-xs text-accent">
            {theme === "dark" ? "D" : "L"}
          </span>
          {labels ? (
            <span>
              {theme === "dark" ? "Thème sombre" : "Thème clair"}
            </span>
          ) : null}
        </Button>

        {HAS_CLERK ? (
          <ClerkAuthControls
            collapsed={!labels}
            mobileOpen={mobileOpen}
          />
        ) : (
          <Button
            asChild
            variant="outline"
            className="h-10 w-full rounded-none"
          >
            <Link href="/sign-in">
              {labels ? "Se connecter" : "→"}
            </Link>
          </Button>
        )}

        {labels ? (
          <p
            className={
              "flex items-center gap-1.5 px-1 text-[10px] " +
              "leading-snug text-muted-foreground"
            }
          >
            <FlagFr className="h-2 w-3 shrink-0 opacity-70" />
            <span>Données publiques · France</span>
          </p>
        ) : null}
      </div>
    );
  }

  const logoBlock = (
    <Link
      href="/"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        showLabels ? "px-2 py-4" : "px-1 py-3",
      )}
    >
      <p
        className={cn(
          "font-[family-name:var(--font-logo)] tracking-wide",
          "text-[var(--logo)]",
          showLabels ? "text-lg" : "text-[10px] leading-tight",
        )}
      >
        {showLabels ? "PHRONESIS" : "PH"}
      </p>
      {showLabels ? (
        <>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Comprendre avant de juger
          </p>
          {todayLabel ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {todayLabel}
            </p>
          ) : null}
        </>
      ) : null}
    </Link>
  );

  const desktopPanel = (
    <div
      className={
        "flex h-full flex-col border-r border-sidebar-border " +
        "bg-sidebar text-sidebar-foreground"
      }
    >
      <div className="relative border-b border-sidebar-border">
        {logoBlock}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            "absolute right-0 top-0 hidden size-8 rounded-none " +
            "md:inline-flex"
          }
          onClick={() => persistCollapse(!collapsed)}
          aria-label={
            collapsed ? "Ouvrir le menu" : "Réduire le menu"
          }
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
      <NavLinks labels={showLabels} />
      <Footer labels={showLabels} />
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-screen overflow-hidden",
          "transition-[width] duration-300 ease-out md:block",
          widthClass,
        )}
      >
        {desktopPanel}
      </aside>

      <div
        className={
          "fixed inset-x-0 top-0 z-50 flex h-11 items-center " +
          "justify-between border-b border-sidebar-border " +
          "bg-sidebar px-3 md:hidden"
        }
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-none"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-56 max-w-[85vw] rounded-none p-0"
          >
            <SheetHeader className="border-b border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={
                  "px-4 py-4 text-center " +
                  "font-[family-name:var(--font-logo)] text-lg " +
                  "tracking-wide text-[var(--logo)]"
                }
              >
                PHRONESIS
              </Link>
            </SheetHeader>
            <div className="flex h-[calc(100%-4.5rem)] flex-col">
              <NavLinks
                labels
                onNavigate={() => setMobileOpen(false)}
              />
              <Footer labels />
            </div>
          </SheetContent>
        </Sheet>
        <Link
          href="/"
          className={
            "font-[family-name:var(--font-logo)] text-base " +
            "text-[var(--logo)]"
          }
        >
          PHRONESIS
        </Link>
        <div className="w-10" />
      </div>
    </>
  );
}
