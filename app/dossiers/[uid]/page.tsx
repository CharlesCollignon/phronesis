import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { EmpreintePanel } from "@/components/empreinte-panel";
import { ExternalLink } from "@/components/external-link";
import { ResonancePanel } from "@/components/resonance-panel";
import { ResumeIa } from "@/components/resume-ia";
import { ScorePhronesisPanel } from "@/components/score-phronesis";
import { SondageDossier } from "@/components/sondage-dossier";
import { VoteBar } from "@/components/vote-bar";
import { formatDate, formatDateShort, formatSort } from "@/lib/format";
import { getDossier } from "@/lib/queries";
import { computeScorePhronesis } from "@/lib/score-phronesis";
import { urlDossierAn } from "@/lib/urls";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uid: string }>;
};

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

  const officialHref = urlDossierAn(
    dossier.legislature,
    dossier.titreChemin,
  );

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

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "Lois", href: "/dossiers" },
        { label: dossierLabel },
      ]}
    >
      {dossier.procedureLibelle ? (
        <p className="text-sm text-muted-foreground">
          {dossier.procedureLibelle}
        </p>
      ) : null}
      <h1 className="mt-2 max-w-4xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {dossier.titre}
      </h1>
      <div className="mt-4 flex flex-wrap gap-3">
        {officialHref ? (
          <ExternalLink href={officialHref}>
            Dossier officiel Assemblée nationale
          </ExternalLink>
        ) : null}
      </div>

      <div className="mt-6">
        <ResumeIa resume={resume} documents={documents} />
      </div>

      <div className="mt-6">
        <SondageDossier dossierUid={dossier.uid} />
      </div>

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
        <div className="flex h-full min-h-0 flex-col gap-6">
          <ScorePhronesisPanel score={score} />
          <div className="flex min-h-0 flex-1 flex-col [&>*]:min-h-0 [&>*]:flex-1">
            <ResonancePanel
              rows={empreintes.map((e) => ({
                axe: e.axe,
                impact: e.impact,
              }))}
              compareLabel="Projection loi"
            />
          </div>
        </div>
        <div className="flex h-full min-h-0 flex-col [&>*]:min-h-0 [&>*]:flex-1">
          <EmpreintePanel rows={empreintes} />
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">
          Chronologie
        </h2>
        {actes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune étape procédurale enregistrée.
          </p>
        ) : (
          <ol className="mt-4 space-y-2 border-l border-border pl-4">
            {actes.map((a) => (
              <li
                key={a.uid}
                style={{ marginLeft: a.profondeur * 12 }}
                className="text-sm"
              >
                <span className="text-xs text-muted-foreground">
                  {formatDate(a.date)}
                </span>
                <p className="leading-snug">
                  {a.libelle ?? a.code}
                  {a.statut ? (
                    <span className="text-muted-foreground">
                      {" "}
                      — {a.statut}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">
          Scrutins liés
        </h2>
        {scrutins.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun scrutin public lié à ce dossier. L&apos;adoption
            d&apos;un texte peut se faire à main levée, sans trace
            nominative.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {scrutins.map((s) => (
              <li key={s.uid}>
                <Link
                  href={`/scrutins/${s.uid}`}
                  className="block border border-border bg-card p-4 transition hover:border-[var(--accent)]/40"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>n° {s.numero}</span>
                    <span>·</span>
                    <span>{formatDateShort(s.dateScrutin)}</span>
                    <Badge
                      tone={
                        s.sortCode.toLowerCase().includes("adopt")
                          ? "adopte"
                          : "rejete"
                      }
                    >
                      {formatSort(s.sortCode)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm">{s.titre}</p>
                  <div className="mt-3 max-w-md">
                    <VoteBar
                      pour={s.pour ?? 0}
                      contre={s.contre ?? 0}
                      abstentions={0}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">
          Amendements
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {amendements.length >= 100
            ? "100 premiers amendements (par date de dépôt)."
            : `${amendements.length} amendement(s).`}
        </p>
        <ul className="mt-4 space-y-3">
          {amendements.map((a) => (
            <li
              key={a.uid}
              className=" border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{a.numeroLong ?? a.uid}</span>
                {a.articleDesignation ? (
                  <>
                    <span>·</span>
                    <span>{a.articleDesignation}</span>
                  </>
                ) : null}
                {a.sort ? (
                  <Badge
                    tone={
                      a.sort.toLowerCase().includes("adopt")
                        ? "adopte"
                        : a.sort.toLowerCase().includes("rejet")
                          ? "rejete"
                          : "neutral"
                    }
                  >
                    {a.sort}
                  </Badge>
                ) : null}
              </div>
              {a.exposeSommaire ? (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed">
                  {a.exposeSommaire}
                </p>
              ) : a.dispositif ? (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {a.dispositif}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
