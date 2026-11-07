import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { GroupeSigle, couleurDe } from "@/components/groupe-couleur";
import { Hemicycle } from "@/components/hemicycle";
import { formatNumber } from "@/lib/format";
import { listGroupesEffectifs } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ chambre?: string }>;
};

export const metadata = {
  title: "Groupes parlementaires",
};

/** Sièges de chaque chambre (part des sièges). */
const SIEGES = { AN: 577, SENAT: 348 } as const;

export default async function GroupesPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { chambre: raw } = await searchParams;
  const chambre: "AN" | "SENAT" = raw === "SENAT" ? "SENAT" : "AN";
  const effectifs = await listGroupesEffectifs(chambre);
  const sorted = [...effectifs].sort(
    (a, b) =>
      b.effectif - a.effectif || a.libelle.localeCompare(b.libelle, "fr"),
  );
  const sieges = SIEGES[chambre];
  const rattaches = sorted.reduce((s, g) => s + g.effectif, 0);
  const elus = chambre === "AN" ? "députés" : "sénateurs";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Groupes" },
      ]}
    >
      <PageHeader
        title="Groupes"
        description="Les groupes parlementaires en exercice, leur effectif, leurs membres et leur profil de vote. Présentés par ordre d'effectif, chacun avec sa couleur officielle."
        aside={
          <FilterTabs
            variant="segmented"
            label="Chambre"
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
        }
      />

      <section className="pt-12" aria-label="Liste des groupes">
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_minmax(0,300px)_64px_20px] gap-6 px-2 pb-2.5 text-[13px] text-muted-foreground md:grid">
          <span>Sigle</span>
          <span>Nom</span>
          <span>Part des sièges</span>
          <span className="text-right">Membres</span>
          <span />
        </div>
        <ul className="border-b border-border">
          {sorted.map((g, i) => (
            <li key={g.uid}>
              <Link
                href={`/groupes/${g.uid}`}
                className="row-link group grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-x-4 gap-y-2 border-t border-border px-2 py-5 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,300px)_64px_20px] md:gap-x-6"
              >
                <GroupeSigle
                  abrege={g.libelleAbrege}
                  couleur={g.couleur}
                  size={12}
                  className="text-[17px] font-semibold"
                />
                <span className="text-base leading-snug">{g.libelle}</span>
                <span
                  className="hidden h-1.5 bg-[var(--vote-neutre)] md:block"
                  role="img"
                  aria-label={`${((100 * g.effectif) / sieges).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % des sièges`}
                >
                  <span
                    className="grow-x block h-full"
                    style={{
                      backgroundColor: couleurDe(g.libelleAbrege, g.couleur),
                      width: `${(100 * g.effectif) / sieges}%`,
                      animationDelay: `${200 + i * 50}ms`,
                    }}
                  />
                </span>
                <span className="num text-right text-[17px]">
                  {formatNumber(g.effectif)}
                </span>
                <ArrowRight
                  aria-hidden
                  className="nudge hidden size-[18px] text-muted-foreground group-hover:text-foreground md:block"
                  strokeWidth={1.8}
                />
              </Link>
            </li>
          ))}
        </ul>
        <p className="num mt-4 text-sm text-muted-foreground">
          {formatNumber(rattaches)} {elus} rattachés à un groupe ou non
          inscrits, sur {formatNumber(sieges)} sièges.
        </p>
      </section>

      <section className="pt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-6">
          <h2 className="text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]">
            Hémicycle
          </h2>
          <p className="text-sm text-muted-foreground">
            Schéma par groupe · ordre de lecture gauche → droite
          </p>
        </div>
        <div className="border-t border-border pt-8">
          <Hemicycle groups={effectifs} chambre={chambre} />
        </div>
      </section>
    </PageShell>
  );
}
