import Link from "next/link";

import { PageShell } from "@/components/breadcrumbs";
import { SearchForm } from "@/components/search-form";
import { listDossiers } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function DossiersPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = 40;
  const rows = await listDossiers({
    search: q,
    limit,
    offset: (page - 1) * limit,
  });

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Lois" },
      ]}
    >
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Dossiers législatifs
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Projets et propositions de loi de la 17<sup>e</sup> législature,
        avec accès permanent au texte officiel.
      </p>
      <div className="mt-6 max-w-xl">
        <SearchForm
          action="/dossiers"
          placeholder="Rechercher un dossier…"
          defaultValue={q}
          compact
        />
      </div>

      <ul className="mt-8 space-y-3">
        {rows.map((d) => (
          <li key={d.uid}>
            <Link
              href={`/dossiers/${d.uid}`}
              className="block border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40"
            >
              {d.procedureLibelle ? (
                <p className="text-xs text-[var(--muted)]">
                  {d.procedureLibelle}
                </p>
              ) : null}
              <p className="mt-1 text-sm leading-snug">{d.titre}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex gap-3">
        {page > 1 ? (
          <Link
            href={`/dossiers?q=${encodeURIComponent(q)}&page=${page - 1}`}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← Précédent
          </Link>
        ) : null}
        {rows.length === limit ? (
          <Link
            href={`/dossiers?q=${encodeURIComponent(q)}&page=${page + 1}`}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Suivant →
          </Link>
        ) : null}
      </div>
    </PageShell>
  );
}
