"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/dossiers", label: "Lois" },
  { href: "/scrutins", label: "Votes" },
  { href: "/deputes", label: "Députés" },
  { href: "/senateurs", label: "Sénateurs" },
  { href: "/comparateur", label: "Comparateur" },
  { href: "/groupes", label: "Groupes" },
  { href: "/boussole", label: "Boussole" },
  { href: "/philosophies", label: "Philosophies" },
  { href: "/recherche", label: "Recherche" },
  { href: "/methodologie", label: "Méthodologie" },
] as const;

export function SiteHeader(): React.ReactElement {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
            Phronesis
          </span>
          <span className="hidden text-xs text-[var(--muted)] lg:inline">
            Comprendre avant de juger
          </span>
        </Link>

        <nav className="hidden flex-wrap items-center justify-end gap-0.5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 px-2.5 py-2 text-sm text-[var(--ink)]/80 transition hover:bg-[var(--marine)]/8 hover:text-[var(--marine)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-[var(--border)] text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-[var(--border)] bg-[var(--paper)] px-4 py-3 md:hidden"
        >
          <ul className="grid gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center px-3 text-sm font-medium hover:bg-[var(--wash)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
