import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/badge";
import { PageHeader, PageShell, SectionHeading } from "@/components/breadcrumbs";
import { ScrutinCharts } from "@/components/charts/scrutin-charts";
import { ExternalLink } from "@/components/external-link";
import { GroupeSigle } from "@/components/groupe-couleur";
import { HemicyclePositions } from "@/components/hemicycle-positions";
import { SondageScrutin } from "@/components/sondage-scrutin";
import { VoteFilters } from "@/components/vote-filters";
import {
  capitalizeTitre,
  decoderEntites,
  formatDate,
  formatNumber,
  formatPosition,
  formatSort,
  nomComplet,
} from "@/lib/format";
import { getScrutin, getScrutinVotes } from "@/lib/queries";
import { urlScrutinAn, urlScrutinSenat } from "@/lib/urls";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ position?: string; groupe?: string }>;
};

/** Libellé de majorité d'un groupe (positions exprimées). */
function majorite(pour: number, contre: number, abst: number): string {
  if (pour + contre + abst === 0) return "Aucune position exprimée";
  if (pour >= contre && pour >= abst) {
    return pour === contre ? "Partagé" : "Majorité pour";
  }
  if (contre >= abst) return "Majorité contre";
  return "Majorité abst.";
}

const POSITION_TONE: Record<string, "pour" | "contre" | "abstention" | "neutral"> =
  {
    pour: "pour",
    contre: "contre",
    abstention: "abstention",
  };

export default async function ScrutinPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const filters = await searchParams;
  const data = await getScrutin(uid);
  if (!data) notFound();

  const { scrutin, dossier, amendement, parGroupe } = data;
  const senat = scrutin.chambre === "SENAT";
  const groupesOrdonnes = [...parGroupe].sort(
    (a, b) =>
      b.pour +
      b.contre +
      b.abstention +
      b.nonVotant -
      (a.pour + a.contre + a.abstention + a.nonVotant),
  );
  const voteRows = await getScrutinVotes(
    uid,
    filters.position,
    filters.groupe,
  );

  const positionCounts = {
    pour: scrutin.pour ?? 0,
    contre: scrutin.contre ?? 0,
    abstention: scrutin.abstentions ?? 0,
    nonVotant: scrutin.nonVotants ?? 0,
  };

  const chambreLabel = senat ? "Sénat" : "Assemblée nationale";
  const adopte = scrutin.sortCode.toLowerCase().includes("adopt");
  const sourceHref = senat
    ? urlScrutinSenat(scrutin.legislature, scrutin.numero)
    : urlScrutinAn(scrutin.legislature, scrutin.numero);
  const filtreActif = Boolean(filters.position || filters.groupe);

  const meta: [string, React.ReactNode][] = [
    ["Pour", formatNumber(scrutin.pour)],
    ["Contre", formatNumber(scrutin.contre)],
    ["Abstentions", formatNumber(scrutin.abstentions)],
    ["Non-votants", formatNumber(scrutin.nonVotants)],
  ];
  if (scrutin.suffragesRequis != null) {
    meta.push(["Majorité requise", formatNumber(scrutin.suffragesRequis)]);
  }
  if (scrutin.demandeur) {
    meta.push(["Demandé par", scrutin.demandeur]);
  }

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Votes", href: "/scrutins" },
        { label: `Scrutin n° ${formatNumber(scrutin.numero)}` },
      ]}
    >
      <PageHeader
        size="long"
        eyebrow={
          <>
            Scrutin public n° {formatNumber(scrutin.numero)} · {chambreLabel}{" "}
            · {formatDate(scrutin.dateScrutin)}
          </>
        }
        title={capitalizeTitre(scrutin.titre)}
        description={
          scrutin.typeVoteLibelle ? (
            <p className="text-base">
              {capitalizeTitre(scrutin.typeVoteLibelle)}
            </p>
          ) : undefined
        }
        aside={
          <div className="sm:text-right">
            <Badge
              tone={adopte ? "adopte" : "rejete"}
              className="gap-2.5 text-[22px] font-semibold [&>span:first-child]:size-3"
            >
              {formatSort(scrutin.sortCode)}
            </Badge>
            <p className="num mt-1.5 text-[15px] text-[#404040] dark:text-muted-foreground">
              {scrutin.nombreVotants != null
                ? `${formatNumber(scrutin.nombreVotants)} votants`
                : null}
              {scrutin.nombreVotants != null &&
              scrutin.suffragesExprimes != null
                ? " · "
                : null}
              {scrutin.suffragesExprimes != null
                ? `${formatNumber(scrutin.suffragesExprimes)} suffrages exprimés`
                : null}
            </p>
          </div>
        }
      />

      <section
        aria-label="Répartition des positions"
        className="mt-12 border-t border-foreground pt-8"
      >
        <HemicyclePositions
          pour={scrutin.pour ?? 0}
          contre={scrutin.contre ?? 0}
          abstentions={scrutin.abstentions ?? 0}
          sieges={senat ? 348 : 577}
        />
      </section>

      {amendement ? (
        <section
          aria-labelledby="amendement"
          className="mt-12 border-t border-foreground pt-6"
        >
          <p id="amendement" className="eyebrow">
            Amendement mis aux voix
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[15px]">
            <span className="num font-semibold">
              n° {amendement.numeroLong ?? "—"}
            </span>
            {amendement.auteurUid ? (
              <Link
                href={`/deputes/${amendement.auteurUid}`}
                className="ln font-medium"
              >
                {nomComplet(
                  amendement.auteurPrenom ?? "",
                  amendement.auteurNom ?? "",
                )}
              </Link>
            ) : null}
            {amendement.groupeLibelle ? (
              <GroupeSigle
                abrege={amendement.groupeLibelle}
                couleur={amendement.groupeCouleur}
                className="text-sm text-muted-foreground"
              />
            ) : null}
            {amendement.articleDesignation ? (
              <span className="text-muted-foreground">
                {amendement.articleDesignation}
              </span>
            ) : null}
          </div>
          {amendement.exposeSommaire || amendement.dispositif ? (
            <div className="mt-4 grid max-w-4xl gap-5 md:grid-cols-2">
              {amendement.dispositif ? (
                <div>
                  <h3 className="text-sm font-semibold">Ce qu&apos;il propose</h3>
                  <p className="mt-1.5 line-clamp-[8] whitespace-pre-line text-[15px] leading-relaxed">
                    {decoderEntites(amendement.dispositif)}
                  </p>
                </div>
              ) : null}
              {amendement.exposeSommaire ? (
                <div>
                  <h3 className="text-sm font-semibold">
                    Exposé de l&apos;auteur
                  </h3>
                  <p className="mt-1.5 line-clamp-[8] whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                    {decoderEntites(amendement.exposeSommaire)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          <p className="mt-3 text-[13px] text-muted-foreground">
            Rattaché automatiquement à partir de l&apos;intitulé du scrutin
            (numéro, auteur, date).
          </p>
        </section>
      ) : null}

      <div className="mt-[clamp(56px,7vw,80px)] flex flex-wrap items-start gap-14">
        <div className="min-w-0 flex-[2_1_600px]">
          <section aria-labelledby="par-groupe">
            <SectionHeading
              id="par-groupe"
              rule
              title="Par groupe"
              aside="Positions exprimées, ordre par effectif"
            />
            <ul className="border-b border-border">
              {groupesOrdonnes.map((g, i) => {
                const exprimes = g.pour + g.contre + g.abstention;
                const parts = [
                  g.pour ? `${g.pour} pour` : null,
                  g.contre ? `${g.contre} contre` : null,
                  g.abstention ? `${g.abstention} abst.` : null,
                  g.nonVotant ? `${g.nonVotant} n.-v.` : null,
                ].filter(Boolean);
                const nom = g.libelleAbrege ?? g.libelle ?? "Sans groupe";
                const content = (
                  <>
                    <span className="min-w-0">
                      <GroupeSigle
                        abrege={g.libelleAbrege}
                        couleur={g.couleur}
                        className="flex text-[15px] font-semibold"
                      >
                        {nom}
                      </GroupeSigle>
                      <span className="num mt-0.5 block text-[13px] text-muted-foreground md:hidden">
                        {parts.join(" · ")}
                      </span>
                    </span>
                    <span
                      role="img"
                      aria-label={`${g.libelle ?? nom} : ${parts.join(", ") || "aucune position"}`}
                      className="flex h-2 gap-0.5"
                    >
                      {exprimes > 0 ? (
                        (
                          [
                            [g.pour, "bg-[var(--vote-pour)]"],
                            [g.contre, "bg-[var(--vote-contre)]"],
                            [g.abstention, "bg-[var(--vote-abstention)]"],
                          ] as const
                        ).map(([n, cls], k) =>
                          n > 0 ? (
                            <span
                              key={k}
                              className={cn("grow-x", cls)}
                              style={{
                                width: `${(100 * n) / exprimes}%`,
                                animationDelay: `${300 + i * 50}ms`,
                              }}
                            />
                          ) : null,
                        )
                      ) : (
                        <span className="w-full bg-muted" />
                      )}
                    </span>
                    <span className="hidden text-sm font-medium md:block">
                      {majorite(g.pour, g.contre, g.abstention)}
                    </span>
                    <span className="num hidden text-right text-[13px] text-[#404040] md:block dark:text-muted-foreground">
                      {parts.join(" · ") || "—"}
                    </span>
                  </>
                );
                const rowCls =
                  "grid grid-cols-[minmax(0,110px)_minmax(0,1fr)] items-center gap-5 border-t border-border px-2 py-3.5 md:grid-cols-[96px_minmax(0,1fr)_128px_170px]";
                return (
                  <li key={g.groupeUid ?? "sans-groupe"}>
                    {g.groupeUid ? (
                      <Link
                        href={`/groupes/${g.groupeUid}`}
                        className={cn("row-link", rowCls)}
                        title={g.libelle ?? undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={rowCls}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3.5 text-[13px] text-muted-foreground">
              Noir : pour · gris : contre · clair : abstention. Les
              non-votants (n.-v.) sont indiqués en détail.
            </p>
          </section>

          <section aria-labelledby="effectifs" className="pt-16">
            <SectionHeading
              id="effectifs"
              rule
              title="Effectifs par groupe"
              aside="Nombre de voix, douze premiers groupes"
            />
            <div className="pt-4">
              <ScrutinCharts parGroupe={groupesOrdonnes} />
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-10">
          <section>
            <p className="eyebrow">Dossier</p>
            {dossier ? (
              <Link
                href={`/dossiers/${dossier.uid}`}
                className="mt-2.5 block text-[17px] font-medium leading-snug"
              >
                <span className="ln">{capitalizeTitre(dossier.titre)}</span>
              </Link>
            ) : (
              <p className="mt-2.5 text-[15px] text-muted-foreground">
                Ce scrutin n&apos;est rattaché à aucun dossier législatif
                dans les données ouvertes.
              </p>
            )}
            <p className="mt-4">
              <ExternalLink href={sourceHref}>
                {senat
                  ? "Scrutin sur senat.fr"
                  : "Scrutin sur assemblee-nationale.fr"}
              </ExternalLink>
            </p>
          </section>

          <section>
            <p className="eyebrow">Décompte officiel</p>
            <dl className="mt-3 border-b border-border text-[15px]">
              {meta.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-t border-border py-2.5"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="num text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <SondageScrutin
            scrutinUid={scrutin.uid}
            deputesPour={scrutin.pour ?? 0}
            deputesContre={scrutin.contre ?? 0}
            deputesAbstention={scrutin.abstentions ?? 0}
          />
        </aside>
      </div>

      <section
        id="positions"
        aria-labelledby="positions-titre"
        className="scroll-mt-24 pt-[clamp(56px,7vw,80px)]"
      >
        <SectionHeading
          id="positions-titre"
          rule
          title="Positions nominatives"
          aside={
            <span className="num">
              {formatNumber(voteRows.length)}{" "}
              {senat ? "sénateurs" : "députés"}
              {filtreActif ? " (filtré)" : ""}
            </span>
          }
        />
        <div className="pt-5">
          <Suspense fallback={null}>
            <VoteFilters
              positions={[
                {
                  value: "pour",
                  label: "Pour",
                  count: positionCounts.pour,
                },
                {
                  value: "contre",
                  label: "Contre",
                  count: positionCounts.contre,
                },
                {
                  value: "abstention",
                  label: "Abstention",
                  count: positionCounts.abstention,
                },
                {
                  value: "nonVotant",
                  label: "Non-votant",
                  count: positionCounts.nonVotant,
                },
              ]}
              groupes={groupesOrdonnes.map((g) => ({
                uid: g.groupeUid,
                label: g.libelleAbrege ?? g.libelle ?? "?",
              }))}
            />
          </Suspense>
        </div>

        {voteRows.length > 0 ? (
          <>
            <div className="mt-6 hidden grid-cols-[minmax(0,1fr)_160px_120px] gap-5 px-2 pb-2.5 text-[13px] text-muted-foreground sm:grid">
              <span>{senat ? "Sénateur" : "Député"}</span>
              <span>Groupe</span>
              <span>Position</span>
            </div>
            <ul className="mt-4 border-b border-border sm:mt-0">
              {voteRows.map((v) => (
                <li key={v.acteurUid}>
                  <Link
                    href={
                      senat
                        ? `/senateurs/${v.acteurUid}`
                        : `/deputes/${v.acteurUid}`
                    }
                    className="row-link grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 border-t border-border px-2 py-3 sm:grid-cols-[minmax(0,1fr)_160px_120px]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">
                        {nomComplet(v.prenom, v.nom)}
                      </span>
                      <span className="block text-[13px] text-muted-foreground sm:hidden">
                        {v.groupeLibelle ?? "Sans groupe"}
                        {v.parDelegation ? " · par délégation" : null}
                      </span>
                      {v.parDelegation ? (
                        <span className="hidden text-[13px] text-muted-foreground sm:block">
                          Par délégation
                        </span>
                      ) : null}
                    </span>
                    <span className="hidden truncate text-sm text-muted-foreground sm:block">
                      {v.groupeLibelle ?? "—"}
                    </span>
                    <span>
                      <Badge tone={POSITION_TONE[v.position] ?? "neutral"}>
                        {formatPosition(v.position)}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-6 text-[15px] text-[#404040] dark:text-muted-foreground">
            Aucune position ne correspond à ces filtres.
          </p>
        )}
      </section>
    </PageShell>
  );
}
