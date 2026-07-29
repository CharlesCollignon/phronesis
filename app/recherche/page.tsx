import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { SearchForm } from "@/components/search-form";
import { formatDateShort, formatSort, nomComplet } from "@/lib/format";
import { searchAll } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RecherchePage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { q = "" } = await searchParams;
  const results = q ? await searchAll(q) : null;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Recherche" },
      ]}
    >
      <h1 className="font-serif text-4xl tracking-tight">
        Recherche
      </h1>
      <p className="mt-2 text-muted-foreground">
        Plein texte sur les dossiers, scrutins et députés (Postgres
        <code className="mx-1 text-xs">tsvector</code>
        français).
      </p>
      <div className="mt-6 max-w-2xl">
        <SearchForm defaultValue={q} />
      </div>

      {results ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <section>
            <h2 className="font-serif text-xl">
              Dossiers
            </h2>
            <ul className="mt-3 space-y-2">
              {results.dossiers.length === 0 ? (
                <li className="text-sm text-muted-foreground">Aucun résultat</li>
              ) : (
                results.dossiers.map((d) => (
                  <li key={d.uid}>
                    <Link
                      href={`/dossiers/${d.uid}`}
                      className="block border border-border bg-card p-3 text-sm hover:border-[var(--accent)]/40"
                    >
                      {d.titre}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl">
              Scrutins
            </h2>
            <ul className="mt-3 space-y-2">
              {results.scrutins.length === 0 ? (
                <li className="text-sm text-muted-foreground">Aucun résultat</li>
              ) : (
                results.scrutins.map((s) => (
                  <li key={s.uid}>
                    <Link
                      href={`/scrutins/${s.uid}`}
                      className="block border border-border bg-card p-3 text-sm hover:border-[var(--accent)]/40"
                    >
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(s.dateScrutin)} · n° {s.numero}
                      </span>
                      <p className="mt-1 line-clamp-2">{s.titre}</p>
                      <Badge
                        tone={
                          s.sortCode.toLowerCase().includes("adopt")
                            ? "adopte"
                            : "rejete"
                        }
                      >
                        {formatSort(s.sortCode)}
                      </Badge>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl">
              Députés
            </h2>
            <ul className="mt-3 space-y-2">
              {results.deputes.length === 0 ? (
                <li className="text-sm text-muted-foreground">Aucun résultat</li>
              ) : (
                results.deputes.map((d) => (
                  <li key={d.uid}>
                    <Link
                      href={`/deputes/${d.uid}`}
                      className="block border border-border bg-card p-3 text-sm hover:border-[var(--accent)]/40"
                    >
                      {nomComplet(d.prenom, d.nom)}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
