import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageHeader, PageShell } from "@/components/breadcrumbs";
import { FilterTabs } from "@/components/filter-tabs";
import { VoteBar } from "@/components/vote-bar";
import {
  capitalizeTitre,
  formatDate,
  formatNumber,
  formatSort,
} from "@/lib/format";
import { getActualiteAssemblee, getImportHistory } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Cette semaine à l'Assemblée nationale et au Sénat",
  description:
    "Les derniers scrutins publics et dossiers législatifs au Parlement, tirés directement des données officielles, sans commentaire.",
  path: "/actualite",
});

type Filtre = "tous" | "scrutins" | "dossiers";

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

const ROW =
  "row-link grid gap-x-6 gap-y-1 border-t border-border px-2 py-4 md:grid-cols-[150px_minmax(0,1fr)_200px] md:items-baseline";

const KIND = "text-[13px] font-semibold uppercase tracking-[0.04em] text-muted-foreground";

export default async function ActualitePage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { type } = await searchParams;
  const filtre: Filtre =
    type === "scrutins" || type === "dossiers" ? type : "tous";

  const [{ scrutins, dossiers }, imports] = await Promise.all([
    getActualiteAssemblee(),
    getImportHistory(),
  ]);

  const dernierImport = toIsoDate(imports[0]?.importedAt);
  const dernierScrutin = scrutins[0]?.dateScrutin ?? null;

  // Scrutins regroupés par jour de séance (déjà triés du plus récent).
  const jours: { date: string; items: typeof scrutins }[] = [];
  for (const s of scrutins) {
    const key = String(s.dateScrutin ?? "");
    const last = jours[jours.length - 1];
    if (last && last.date === key) last.items.push(s);
    else jours.push({ date: key, items: [s] });
  }

  const showScrutins = filtre !== "dossiers";
  const showDossiers = filtre !== "scrutins";

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "À l'Assemblée" },
      ]}
    >
      <PageHeader
        eyebrow="Actualité parlementaire"
        title="À l'Assemblée"
        description="Ce qui s'est passé au Parlement, tiré directement des données open data déjà ingérées : scrutins publics et dossiers récents. Pas un fil presse, pas un agrégateur de réseaux sociaux, pas de commentaire."
        aside={
          dernierImport || dernierScrutin ? (
            <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1.5 text-sm">
              {dernierImport ? (
                <>
                  <dt className="text-muted-foreground">Dernier import</dt>
                  <dd className="num">
                    <time dateTime={dernierImport}>
                      {formatDate(dernierImport)}
                    </time>
                  </dd>
                </>
              ) : null}
              {dernierScrutin ? (
                <>
                  <dt className="text-muted-foreground">Dernier scrutin</dt>
                  <dd className="num">
                    <time dateTime={String(dernierScrutin)}>
                      {formatDate(dernierScrutin)}
                    </time>
                  </dd>
                </>
              ) : null}
            </dl>
          ) : undefined
        }
      />

      <FilterTabs
        label="Filtrer par type d'événement"
        activeId={filtre}
        className="mt-10 border-b border-border"
        tabs={[
          {
            id: "tous",
            href: "/actualite",
            label: (
              <>
                Tout{" "}
                <span className="num text-muted-foreground">
                  {scrutins.length + dossiers.length}
                </span>
              </>
            ),
          },
          {
            id: "scrutins",
            href: "/actualite?type=scrutins",
            label: (
              <>
                Scrutins publics{" "}
                <span className="num text-muted-foreground">
                  {scrutins.length}
                </span>
              </>
            ),
          },
          {
            id: "dossiers",
            href: "/actualite?type=dossiers",
            label: (
              <>
                Dossiers{" "}
                <span className="num text-muted-foreground">
                  {dossiers.length}
                </span>
              </>
            ),
          },
        ]}
      />

      {showScrutins ? (
        scrutins.length === 0 ? (
          <p className="mt-10 text-base text-muted-foreground">
            Aucun scrutin en base. Lancez l&apos;ingest ou vérifiez la
            connexion Postgres.
          </p>
        ) : (
          jours.map((jour, j) => (
            <section
              key={jour.date || `j-${j}`}
              className="rise mt-10"
              style={{ animationDelay: `${Math.min(j, 6) * 50}ms` }}
              aria-label={jour.date ? formatDate(jour.date) : "Date inconnue"}
            >
              <h2 className="mb-1 text-[15px] font-semibold">
                {jour.date ? (
                  <time dateTime={jour.date}>{formatDate(jour.date)}</time>
                ) : (
                  "Date inconnue"
                )}
              </h2>
              <ul className="border-b border-border">
                {jour.items.map((s) => {
                  const adopte = s.sortCode.toLowerCase().includes("adopt");
                  return (
                    <li key={s.uid}>
                      <Link href={`/scrutins/${s.uid}`} className={ROW}>
                        <span className={KIND}>
                          Scrutin{" "}
                          <span className="num">n° {formatNumber(s.numero)}</span>
                          {s.chambre === "SENAT" ? " · Sénat" : null}
                        </span>
                        <span className="text-base leading-snug">
                          {capitalizeTitre(s.titre)}
                        </span>
                        <span className="mt-1 flex flex-col gap-1.5 md:mt-0 md:items-end">
                          <Badge tone={adopte ? "adopte" : "rejete"}>
                            {formatSort(s.sortCode)}
                          </Badge>
                          <VoteBar
                            pour={s.pour ?? 0}
                            contre={s.contre ?? 0}
                            abstentions={s.abstentions ?? 0}
                            className="w-full max-w-[200px]"
                          />
                          <span className="num text-[13px] text-muted-foreground">
                            {s.pour ?? 0} pour · {s.contre ?? 0} contre
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )
      ) : null}

      {showDossiers ? (
        <section className="mt-14" aria-labelledby="dossiers-actifs">
          <h2
            id="dossiers-actifs"
            className="mb-1 text-[15px] font-semibold"
          >
            Dossiers récemment actifs
          </h2>
          {dossiers.length === 0 ? (
            <p className="mt-3 text-base text-muted-foreground">
              Aucun dossier en base.
            </p>
          ) : (
            <ul className="border-b border-border">
              {dossiers.map((d) => {
                const total = Math.max(d.sondageTotal, 1);
                return (
                  <li key={d.uid}>
                    <Link href={`/dossiers/${d.uid}`} className={ROW}>
                      <span className={KIND}>
                        {d.procedureLibelle ?? "Dossier"}
                      </span>
                      <span className="text-base leading-snug">
                        {capitalizeTitre(d.titre)}
                      </span>
                      {d.sondageTotal > 0 ? (
                        <span className="mt-1 flex flex-col gap-1.5 md:mt-0 md:items-end">
                          <span
                            className="flex h-1.5 w-full max-w-[200px] overflow-hidden bg-[var(--vote-neutre)]"
                            role="img"
                            aria-label={`Avis citoyens : ${d.sondagePour} pour, ${d.sondageContre} contre, ${d.sondagePasAvis} sans avis`}
                          >
                            <span
                              className="bg-[var(--vote-pour)]"
                              style={{
                                width: `${(100 * d.sondagePour) / total}%`,
                              }}
                            />
                            <span
                              className="bg-[var(--vote-contre)]"
                              style={{
                                width: `${(100 * d.sondageContre) / total}%`,
                              }}
                            />
                            <span
                              className="bg-[var(--vote-abstention)]"
                              style={{
                                width: `${(100 * d.sondagePasAvis) / total}%`,
                              }}
                            />
                          </span>
                          <span className="num text-[13px] text-muted-foreground md:text-right">
                            Avis citoyens : {d.sondagePour} pour ·{" "}
                            {d.sondageContre} contre · {d.sondagePasAvis} sans
                            avis ({d.sondageTotal})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-muted-foreground md:text-right">
                          Pas encore d&apos;avis citoyens
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <p className="mt-10 text-sm text-muted-foreground">
        Seuls les scrutins publics sont nominatifs. Une séance peut se tenir
        sans scrutin public enregistré, et un texte peut être adopté à main
        levée.
      </p>
    </PageShell>
  );
}
