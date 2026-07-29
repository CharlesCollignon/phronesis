import Link from "next/link";

import { AvatarParlementaire } from "@/components/avatar-parlementaire";
import { PageShell } from "@/components/breadcrumbs";
import { SearchForm } from "@/components/search-form";
import { nomComplet } from "@/lib/format";
import { listDeputes } from "@/lib/queries";
import { couleurGroupe } from "@/lib/spectre-groupes";
import { urlPhotoDepute } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DeputesPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { q = "" } = await searchParams;
  const rows = await listDeputes(q);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Députés" },
      ]}
    >
      <h1 className="font-serif text-4xl tracking-tight">
        Députés
      </h1>
      <p className="mt-2 text-muted-foreground">
        {rows.length} députés de la 17<sup>e</sup> législature.
      </p>
      <div className="mt-6 max-w-xl">
        <SearchForm
          action="/deputes"
          placeholder="Nom d'un député…"
          defaultValue={q}
          compact
        />
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((d) => (
          <li key={d.uid}>
            <Link
              href={`/deputes/${d.uid}`}
              className="flex h-full min-h-11 gap-3 border border-border bg-card p-4 transition hover:border-[var(--accent)]/40"
            >
              <AvatarParlementaire
                src={urlPhotoDepute(d.uid)}
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.groupeAbrege ?? d.groupeLibelle ?? "Sans groupe"}
                  {d.circoDepartement
                    ? ` · ${d.circoDepartement}${d.circoNum ? ` (${d.circoNum})` : ""}`
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
