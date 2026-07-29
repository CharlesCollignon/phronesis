import Link from "next/link";

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Données issues de{" "}
          <a
            href="https://data.assemblee-nationale.fr/"
            className="underline decoration-[var(--primary)]/50 underline-offset-2 hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            data.assemblee-nationale.fr
          </a>{" "}
          — Licence ouverte.
        </p>
        <div className="flex gap-4">
          <Link href="/methodologie" className="hover:text-foreground">
            Méthodologie
          </Link>
          <span>17<sup>e</sup> législature</span>
        </div>
      </div>
    </footer>
  );
}
