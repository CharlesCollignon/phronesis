import Link from "next/link";

import { Hemicycle } from "@/components/hemicycle";
import { PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { listGroupesLegislature } from "@/lib/comparateur";
import { listGroupesEffectifs } from "@/lib/queries";
import {
  couleurGroupe,
  sortGroupesSpectre,
} from "@/lib/spectre-groupes";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ chambre?: string }>;
};

export const metadata = {
  title: "Groupes parlementaires",
};

export default async function GroupesPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { chambre: raw } = await searchParams;
  const chambre: "AN" | "SENAT" =
    raw === "SENAT" ? "SENAT" : "AN";
  const [rows, effectifs] = await Promise.all([
    listGroupesLegislature(chambre),
    listGroupesEffectifs(chambre),
  ]);
  const sorted = sortGroupesSpectre(rows, chambre);
  const effectifByUid = new Map(
    effectifs.map((e) => [e.uid, e.effectif]),
  );

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Groupes" },
      ]}
    >
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Groupes parlementaires
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Hémicycle schématique (gauche → droite) et fiches de
        groupe. Couleurs officielles AMO + initiales — pas de logos
        de partis.
      </p>

      <div className="mt-6">
        <FilterTabs
          activeId={chambre}
          tabs={[
            { id: "AN", label: "Assemblée nationale", href: "/groupes" },
            {
              id: "SENAT",
              label: "Sénat",
              href: "/groupes?chambre=SENAT",
            },
          ]}
        />
      </div>

      <section className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-8">
        <Hemicycle groups={effectifs} chambre={chambre} />
      </section>

      <p className="mt-8 text-sm text-[var(--muted)]">
        {sorted.length} groupe{sorted.length > 1 ? "s" : ""} ·
        ordre de lecture gauche → droite
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((g) => (
          <li key={g.uid}>
            <Link
              href={`/groupes/${g.uid}`}
              className="flex h-full min-h-11 items-start gap-3 border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40"
            >
              <span
                className="mt-1 inline-flex h-9 min-w-9 items-center justify-center text-xs font-semibold text-white"
                style={{
                  background: couleurGroupe(
                    g.libelleAbrege,
                    g.couleur,
                  ),
                }}
              >
                {(g.libelleAbrege ?? "?").slice(0, 4)}
              </span>
              <div>
                <p className="font-medium">{g.libelle}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {effectifByUid.get(g.uid) ?? "—"} membres
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
