import Link from "next/link";

import { ComparaisonResults } from "@/components/comparaison-results";
import { PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import {
  compareDeputes,
  compareGroupes,
  listGroupesLegislature,
  searchDeputesPourComparateur,
  searchSenateursPourComparateur,
} from "@/lib/comparateur";
import { nomComplet } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comparateur",
};

type PageProps = {
  searchParams: Promise<{
    type?: string;
    a?: string;
    b?: string;
  }>;
};

type ComparateurType =
  | "deputes"
  | "senateurs"
  | "groupes"
  | "groupes_senat";

function resolveType(raw: string | undefined): ComparateurType {
  if (raw === "senateurs") return "senateurs";
  if (raw === "groupes") return "groupes";
  if (raw === "groupes_senat") return "groupes_senat";
  return "deputes";
}

export default async function ComparateurPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const type = resolveType(params.type);
  const uidA = params.a ?? "";
  const uidB = params.b ?? "";

  const isActeur = type === "deputes" || type === "senateurs";
  const [acteurs, groupes] = await Promise.all([
    isActeur
      ? type === "senateurs"
        ? searchSenateursPourComparateur("", 400)
        : searchDeputesPourComparateur("", 400)
      : Promise.resolve([]),
    listGroupesLegislature(
      type === "groupes_senat" ? "SENAT" : "AN",
    ),
  ]);

  let results: React.ReactNode = null;

  if (uidA && uidB && uidA !== uidB) {
    if (isActeur) {
      const cmp = await compareDeputes(uidA, uidB);
      if (cmp) {
        const base =
          type === "senateurs" ? "/senateurs" : "/deputes";
        results = (
          <ComparaisonResults
            labelA={nomComplet(cmp.acteurA.prenom, cmp.acteurA.nom)}
            labelB={nomComplet(cmp.acteurB.prenom, cmp.acteurB.nom)}
            hrefA={`${base}/${cmp.acteurA.uid}`}
            hrefB={`${base}/${cmp.acteurB.uid}`}
            resume={cmp.resume}
            convergences={cmp.convergences}
            divergences={cmp.divergences}
            showNonVotants
          />
        );
      }
    } else {
      const cmp = await compareGroupes(uidA, uidB);
      if (cmp) {
        results = (
          <ComparaisonResults
            labelA={
              cmp.groupeA.libelleAbrege ?? cmp.groupeA.libelle
            }
            labelB={
              cmp.groupeB.libelleAbrege ?? cmp.groupeB.libelle
            }
            resume={cmp.resume}
            convergences={cmp.convergences}
            divergences={cmp.divergences}
          />
        );
      }
    }
  }

  const tabs: { id: ComparateurType; label: string }[] = [
    { id: "deputes", label: "Députés" },
    { id: "senateurs", label: "Sénateurs" },
    { id: "groupes", label: "Groupes AN" },
    { id: "groupes_senat", label: "Groupes Sénat" },
  ];

  const options = isActeur
    ? acteurs.map((d) => ({
        uid: d.uid,
        label: nomComplet(d.prenom, d.nom),
      }))
    : groupes.map((g) => ({ uid: g.uid, label: g.libelle }));

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Comparateur" },
      ]}
    >
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Comparateur
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Comparez les positions de vote sur les scrutins publics —
        Assemblée nationale ou Sénat.
      </p>

      <div className="mt-6">
        <FilterTabs
          activeId={type}
          tabs={tabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            href: `/comparateur?type=${tab.id}`,
          }))}
        />
      </div>

      <form
        method="get"
        className="mt-6 grid gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input type="hidden" name="type" value={type} />
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          A
          <select
            name="a"
            defaultValue={uidA}
            required
            className="border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            <option value="">Choisir…</option>
            {options.map((o) => (
              <option key={o.uid} value={o.uid}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          B
          <select
            name="b"
            defaultValue={uidB}
            required
            className="border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          >
            <option value="">Choisir…</option>
            {options.map((o) => (
              <option key={o.uid} value={o.uid}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:bg-[var(--accent)] sm:w-auto"
          >
            Comparer
          </button>
        </div>
      </form>

      {uidA && uidB && uidA === uidB ? (
        <p className="mt-6 text-sm text-rose-700">
          Choisissez deux entités distinctes.
        </p>
      ) : null}

      {results}
    </PageShell>
  );
}
