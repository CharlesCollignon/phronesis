import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { ComparaisonResults } from "@/components/comparaison-results";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
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

const SUJET: Record<ComparateurType, string> = {
  deputes: "les deux députés",
  senateurs: "les deux sénateurs",
  groupes: "les deux groupes",
  groupes_senat: "les deux groupes",
};

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
        ? searchSenateursPourComparateur("", 700)
        : searchDeputesPourComparateur("", 700)
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
            sujet={SUJET[type]}
            kind={type === "senateurs" ? "Sénateur" : "Député"}
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
            hrefA={`/groupes/${cmp.groupeA.uid}`}
            hrefB={`/groupes/${cmp.groupeB.uid}`}
            metaA={
              cmp.groupeA.libelleAbrege ? cmp.groupeA.libelle : undefined
            }
            metaB={
              cmp.groupeB.libelleAbrege ? cmp.groupeB.libelle : undefined
            }
            sujet={SUJET[type]}
            kind="Groupe"
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

  const sideLabel = isActeur
    ? type === "senateurs"
      ? "Sénateur"
      : "Député"
    : "Groupe";

  const swapHref =
    uidA && uidB && uidA !== uidB
      ? `/comparateur?${new URLSearchParams({ type, a: uidB, b: uidA }).toString()}`
      : null;

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Comparateur" },
      ]}
    >
      <PageHeader
        title="Comparateur"
        description="Comparez les positions de deux élus ou de deux groupes sur l'ensemble des scrutins publics où ils se sont tous deux exprimés, à l'Assemblée nationale ou au Sénat."
      />

      <div className="mt-8 border-b border-border">
        <FilterTabs
          label="Type de comparaison"
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
        className="mt-7 flex flex-wrap items-end gap-4"
      >
        <input type="hidden" name="type" value={type} />
        <label className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <span className="eyebrow">{sideLabel} A</span>
          <select
            name="a"
            defaultValue={uidA}
            required
            className="field w-full"
          >
            <option value="">Choisir…</option>
            {options.map((o) => (
              <option key={o.uid} value={o.uid}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {swapHref ? (
          <Link
            href={swapHref}
            aria-label="Inverser A et B"
            title="Inverser A et B"
            className="group inline-flex size-11 shrink-0 items-center justify-center border border-foreground transition-colors duration-200 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"
          >
            <ArrowLeftRight
              aria-hidden
              className="size-[18px] transition-transform duration-500 ease-[var(--spring)] group-hover:rotate-180"
              strokeWidth={1.8}
            />
          </Link>
        ) : null}
        <label className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <span className="eyebrow">{sideLabel} B</span>
          <select
            name="b"
            defaultValue={uidB}
            required
            className="field w-full"
          >
            <option value="">Choisir…</option>
            {options.map((o) => (
              <option key={o.uid} value={o.uid}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-dark w-full sm:w-auto">
          Comparer
        </button>
      </form>

      {uidA && uidB && uidA === uidB ? (
        <p
          role="alert"
          className="mt-6 bg-[var(--highlight)] px-4 py-3 text-[15px] shadow-[inset_3px_0_0_0_var(--accent)] dark:text-foreground"
        >
          Choisissez deux entités distinctes.
        </p>
      ) : null}

      {results ??
        (!uidA || !uidB ? (
          <p className="mt-10 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
            Choisissez deux {isActeur ? "élus" : "groupes"} puis lancez la
            comparaison. Le taux d&apos;accord est calculé sur les scrutins
            publics où les deux se sont exprimés ;{" "}
            <Link href="/methodologie#comparateur" className="ln text-foreground">
              voir la méthode
            </Link>
            .
          </p>
        ) : null)}
    </PageShell>
  );
}
