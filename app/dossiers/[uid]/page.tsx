import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/badge";
import { PageHeader, PageShell, SectionHeading } from "@/components/breadcrumbs";
import { EmpreinteGrid, IMPACT_LEGEND } from "@/components/empreinte-grid";
import { ExternalLink } from "@/components/external-link";
import { ResonancePanel } from "@/components/resonance-panel";
import { ResumeIa } from "@/components/resume-ia";
import { ScorePhronesisPanel } from "@/components/score-phronesis";
import { SondageDossier } from "@/components/sondage-dossier";
import { VoteBar } from "@/components/vote-bar";
import {
  capitalizeTitre,
  formatDate,
  formatDateShort,
  formatNumber,
  formatSort,
} from "@/lib/format";
import { getDossier } from "@/lib/queries";
import { computeScorePhronesis } from "@/lib/score-phronesis";
import { urlDossierAn } from "@/lib/urls";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Amendements affichés d'emblée ; les suivants sont repliés. */
const AMENDEMENTS_VISIBLES = 10;

type PageProps = {
  params: Promise<{ uid: string }>;
};

function toneSortAmendement(
  sort: string,
): "adopte" | "rejete" | "neutral" {
  const s = sort.toLowerCase();
  if (s.includes("adopt")) return "adopte";
  if (s.includes("rejet")) return "rejete";
  return "neutral";
}

type AmendementRow = {
  uid: string;
  numeroLong: string | null;
  articleDesignation: string | null;
  sort: string | null;
  exposeSommaire: string | null;
  dispositif: string | null;
};

function AmendementItem({ a }: { a: AmendementRow }): React.ReactElement {
  return (
    <li className="grid gap-x-6 gap-y-1.5 border-t border-border px-2 py-4 md:grid-cols-[180px_minmax(0,1fr)_120px]">
      <span className="flex flex-col gap-0.5 text-sm">
        <span className="num font-medium">{a.numeroLong ?? a.uid}</span>
        {a.articleDesignation ? (
          <span className="text-muted-foreground">{a.articleDesignation}</span>
        ) : null}
      </span>
      {a.exposeSommaire ? (
        <p className="line-clamp-3 text-[15px] leading-relaxed">
          {a.exposeSommaire}
        </p>
      ) : a.dispositif ? (
        <p className="line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
          {a.dispositif}
        </p>
      ) : (
        <span className="text-[15px] text-muted-foreground">
          Exposé non disponible.
        </span>
      )}
      <span className="md:text-right">
        {a.sort ? (
          <Badge tone={toneSortAmendement(a.sort)}>{a.sort}</Badge>
        ) : null}
      </span>
    </li>
  );
}

export default async function DossierPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { uid } = await params;
  const data = await getDossier(uid);
  if (!data) notFound();

  const {
    dossier,
    actes,
    documents,
    scrutins,
    amendements,
    amendementsCount,
    resume,
    empreintes,
  } = data;

  const officialHref = urlDossierAn(dossier.legislature, dossier.titreChemin);

  const score = computeScorePhronesis({
    documentsCount: documents.length,
    documentTypeCodes: documents
      .map((d) => d.typeCode)
      .filter((t): t is string => t != null),
    actesCount: actes.length,
    scrutinsCount: scrutins.length,
    amendementsCount,
    hasResumeIa: resume != null,
    hasEmpreinte: empreintes.length > 0,
  });

  const dossierLabel = dossier.titre
    ? dossier.titre.length > 60
      ? `${dossier.titre.slice(0, 60)}…`
      : dossier.titre
    : "Dossier";

  const depot = actes.find((a) => /DEPOT$/i.test(a.code) && a.date);
  const eyebrow = [
    dossier.procedureLibelle,
    depot?.date ? `dépôt le ${formatDate(depot.date)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const empreinteMeta = empreintes[0];
  const amendementsVisibles = amendements.slice(0, AMENDEMENTS_VISIBLES);
  const amendementsReplies = amendements.slice(AMENDEMENTS_VISIBLES);

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Lois", href: "/dossiers" },
        { label: dossierLabel },
      ]}
    >
      <PageHeader
        eyebrow={eyebrow || undefined}
        title={dossier.titre}
        size="long"
        className="max-w-[920px]"
      />
      {officialHref ? (
        <div className="rise mt-6" style={{ animationDelay: "120ms" }}>
          <ExternalLink href={officialHref}>
            Dossier officiel Assemblée nationale
          </ExternalLink>
        </div>
      ) : null}

      <div className="mt-14 flex flex-wrap items-start gap-14">
        <div className="min-w-0 flex-[2_1_600px]">
          <ResumeIa
            resume={resume}
            documents={documents}
            officialHref={officialHref}
          />

          <section className="pt-16" aria-labelledby="empreinte-titre">
            <SectionHeading
              id="empreinte-titre"
              title="Empreinte civique"
              aside={empreintes.length > 0 ? IMPACT_LEGEND : undefined}
            />
            {empreintes.length > 0 ? (
              <>
                <EmpreinteGrid
                  rows={empreintes.map((e) => ({
                    axe: e.axe,
                    impact: e.impact,
                    justification: e.justification,
                    sources: e.sources,
                  }))}
                  cellMin={150}
                />
                <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
                  Analyse qualitative générée par IA
                  {empreinteMeta
                    ? ` (${empreinteMeta.modele} · prompt ${empreinteMeta.promptVersion})`
                    : ""}
                  . Aucune note par axe, aucun jugement moral, aucun conseil
                  de vote.
                </p>
              </>
            ) : (
              <p className="max-w-3xl border-t border-border pt-4 text-base leading-relaxed text-muted-foreground">
                Aucune empreinte n&apos;a encore été générée pour ce dossier.
                Elle décrit des impacts qualitatifs par axe (renforce,
                restreint…), sans note morale.
              </p>
            )}
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Repères civiques (non mesurés) : DDHC 1789 et DUDH 1948. Voir la{" "}
              <Link
                href="/methodologie#reperes-civiques"
                className="ln text-foreground"
              >
                méthodologie
              </Link>
              .
            </p>
          </section>

          <section className="pt-16" aria-labelledby="chronologie-titre">
            <SectionHeading id="chronologie-titre" title="Chronologie" rule />
            {actes.length === 0 ? (
              <p className="pt-4 text-base text-muted-foreground">
                Aucune étape procédurale enregistrée.
              </p>
            ) : (
              <ol className="pt-2">
                {actes.map((a) => (
                  <li
                    key={a.uid}
                    className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-5 border-b border-border/60 py-3 sm:grid-cols-[120px_minmax(0,1fr)]"
                  >
                    <span className="num text-sm text-muted-foreground">
                      {a.date ? (
                        <time dateTime={String(a.date)}>
                          {formatDateShort(a.date)}
                        </time>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[15px] leading-snug",
                        a.profondeur === 0 && "font-semibold",
                      )}
                      style={{
                        paddingLeft: `${Math.min(a.profondeur, 4) * 20}px`,
                      }}
                    >
                      {a.libelle ?? a.code}
                      {a.statut ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {a.statut}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="pt-16" aria-labelledby="scrutins-titre">
            <SectionHeading
              id="scrutins-titre"
              title="Scrutins publics liés"
              aside={
                scrutins.length > 0
                  ? `${formatNumber(scrutins.length)} scrutin${scrutins.length > 1 ? "s" : ""}`
                  : undefined
              }
              rule
            />
            {scrutins.length === 0 ? (
              <p className="max-w-3xl pt-4 text-base leading-relaxed text-muted-foreground">
                Aucun scrutin public lié à ce dossier. L&apos;adoption
                d&apos;un texte peut se faire à main levée, sans trace
                nominative.
              </p>
            ) : (
              <ul className="border-b border-border">
                {scrutins.map((s, i) => {
                  const adopte = s.sortCode.toLowerCase().includes("adopt");
                  return (
                    <li key={s.uid}>
                      <Link
                        href={`/scrutins/${s.uid}`}
                        className={cn(
                          "row-link grid grid-cols-[minmax(0,1fr)_88px] items-baseline gap-x-5 gap-y-1 px-2 py-4 md:grid-cols-[110px_minmax(0,1fr)_92px_120px]",
                          i > 0 && "border-t border-border",
                        )}
                      >
                        <span className="num col-span-2 text-sm text-muted-foreground md:col-span-1">
                          n° {formatNumber(s.numero)} ·{" "}
                          {formatDateShort(s.dateScrutin)}
                        </span>
                        <span className="text-base leading-snug">
                          {capitalizeTitre(s.titre)}
                        </span>
                        <Badge tone={adopte ? "adopte" : "rejete"}>
                          {formatSort(s.sortCode)}
                        </Badge>
                        <span className="hidden flex-col items-end gap-1.5 md:flex">
                          <VoteBar
                            pour={s.pour ?? 0}
                            contre={s.contre ?? 0}
                            abstentions={0}
                          />
                          <span className="num text-[13px] text-muted-foreground">
                            {s.pour ?? 0} · {s.contre ?? 0}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="pt-16" aria-labelledby="amendements-titre">
            <SectionHeading
              id="amendements-titre"
              title="Amendements"
              aside={
                amendementsCount > 0
                  ? amendementsCount > amendements.length
                    ? `${formatNumber(amendements.length)} premiers sur ${formatNumber(amendementsCount)}, par date de dépôt`
                    : `${formatNumber(amendementsCount)} amendement${amendementsCount > 1 ? "s" : ""}`
                  : undefined
              }
              rule
            />
            {amendements.length === 0 ? (
              <p className="pt-4 text-base text-muted-foreground">
                Aucun amendement déposé à ce jour.
              </p>
            ) : (
              <>
                <ul className="border-b border-border [&>li:first-child]:border-t-0">
                  {amendementsVisibles.map((a) => (
                    <AmendementItem key={a.uid} a={a} />
                  ))}
                </ul>
                {amendementsReplies.length > 0 ? (
                  <details className="group/amd">
                    <summary className="mt-4 inline-flex cursor-pointer list-none items-center gap-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                      <span className="ln">
                        <span className="group-open/amd:hidden">
                          Afficher les {formatNumber(amendementsReplies.length)}{" "}
                          autres amendements
                        </span>
                        <span className="hidden group-open/amd:inline">
                          Masquer les amendements suivants
                        </span>
                      </span>
                    </summary>
                    <ul className="reveal mt-4 border-b border-border">
                      {amendementsReplies.map((a) => (
                        <AmendementItem key={a.uid} a={a} />
                      ))}
                    </ul>
                  </details>
                ) : null}
              </>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-10">
          <ScorePhronesisPanel score={score} />
          <ResonancePanel
            rows={empreintes.map((e) => ({
              axe: e.axe,
              impact: e.impact,
            }))}
            compareLabel="Projection loi"
            title="Résonance avec vos valeurs"
          />
          <SondageDossier dossierUid={dossier.uid} />
        </aside>
      </div>
    </PageShell>
  );
}
