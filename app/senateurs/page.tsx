import Link from "next/link";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import { PageShell } from "@/components/breadcrumbs";
import { SearchForm } from "@/components/search-form";
import { nomComplet } from "@/lib/format";
import { listSenateurs } from "@/lib/queries";
import { couleurGroupe } from "@/lib/spectre-groupes";
import { urlPhotoSenateur } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sénateurs",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SenateursPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { q = "" } = await searchParams;
  const rows = await listSenateurs(q);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Sénateurs" },
      ]}
    >
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Sénateurs
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        {rows.length} sénateurs en mandat (données AMO Assemblée /
        open data Sénat).
      </p>
      <div className="mt-6 max-w-xl">
        <SearchForm
          action="/senateurs"
          placeholder="Nom d'un sénateur…"
          defaultValue={q}
          compact
        />
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((d) => (
          <li key={d.uid}>
            <Link
              href={`/senateurs/${d.uid}`}
              className="flex h-full min-h-11 gap-3 border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40"
            >
              <AvatarParlementaire
                src={urlPhotoSenateur(
                  d.senatMatricule,
                  d.prenom,
                  d.nom,
                )}
                prenom={d.prenom}
                nom={d.nom}
                size={48}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0"
                    style={{
                      background: couleurGroupe(
                        d.groupeAbrege,
                        d.groupeCouleur,
                      ),
                    }}
                  />
                  <p className="truncate font-medium">
                    {nomComplet(d.prenom, d.nom)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {d.groupeAbrege ?? d.groupeLibelle ?? "Sans groupe"}
                  {d.circoDepartement
                    ? ` · ${d.circoDepartement}`
                    : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
