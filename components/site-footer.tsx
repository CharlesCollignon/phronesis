import Link from "next/link";

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Données issues de{" "}
          <a
            href="https://data.assemblee-nationale.fr/"
            className="underline decoration-[var(--accent-ink)]/50 underline-offset-2 hover:text-[var(--ink)]"
            rel="noreferrer"
            target="_blank"
          >
            data.assemblee-nationale.fr
          </a>{" "}
          — Licence ouverte.
        </p>
        <div className="flex gap-4">
          <Link href="/methodologie" className="hover:text-[var(--ink)]">
            Méthodologie
          </Link>
          <span>17<sup>e</sup> législature</span>
        </div>
      </div>
    </footer>
  );
}
