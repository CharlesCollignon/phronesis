import Link from "next/link";

import { Badge } from "@/components/badge";
import { HomeDossierCard } from "@/components/home-dossier-card";
import { VoteBar } from "@/components/vote-bar";
import {
  capitalizeTitre,
  formatDateShort,
  formatNumber,
  formatSort,
} from "@/lib/format";
import { getHomeStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactElement> {
  const {
    counts,
    derniersScrutins,
    derniersDossiers,
    derniereDateScrutin,
  } = await getHomeStats();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
      <div
        className={
          "flex flex-wrap items-center gap-x-3 gap-y-1 border-b " +
          "border-border py-2 text-[11px] text-muted-foreground"
        }
      >
        <span>
          <span className="font-medium text-foreground">
            {formatNumber(Number(counts.dossiers))}
          </span>{" "}
          dossiers
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="font-medium text-foreground">
            {formatNumber(Number(counts.scrutins))}
          </span>{" "}
          scrutins
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="font-medium text-foreground">
            {formatNumber(Number(counts.deputes))}
          </span>{" "}
          députés
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="font-medium text-foreground">
            {formatNumber(Number(counts.votes))}
          </span>{" "}
          positions
        </span>
        {derniereDateScrutin ? (
          <>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span className="w-full sm:w-auto">
              Dernier scrutin en base :{" "}
              <time
                dateTime={derniereDateScrutin}
                className="font-medium text-foreground"
              >
                {formatDateShort(derniereDateScrutin)}
              </time>
            </span>
          </>
        ) : null}
      </div>

      <header className="border-b border-border pb-8 pt-6">
        <h1
          className={
            "font-[family-name:var(--font-logo)] text-4xl " +
            "tracking-wide text-[var(--logo)] sm:text-5xl"
          }
        >
          PHRONESIS
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Du grec <span className="italic">phrónēsis</span> : sagesse
          pratique — comprendre les lois et les votes{" "}
          <strong className="font-medium text-foreground">
            avant de juger
          </strong>
          .
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              L&apos;idée
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Croiser l&apos;open data parlementaire (dossiers,
              scrutins publics, députés) avec une méthode de lecture
              claire — sans orienter politiquement.
            </p>
          </div>
          <div className="border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Boussole
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Un quiz de valeurs (pas gauche/droite) qui construit
              votre carte d&apos;axes — liberté, égalité, écologie…
            </p>
            <Link
              href="/boussole"
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Faire la Boussole →
            </Link>
          </div>
          <div className="border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Empreinte
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Impacts qualitatifs d&apos;un dossier par axe (renforce /
              restreint / …), sans note morale ni conseil de vote.
            </p>
          </div>
          <div className="border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Score Phronesis
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Robustesse documentaire du dossier (sources,
              chronologie, empreinte…) — distinct de la résonance avec
              vos valeurs.
            </p>
            <Link
              href="/methodologie"
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Méthodologie →
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl">À l&apos;Assemblée</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Scrutins et dossiers récents — open data, pas de fil
              presse.
            </p>
          </div>
          <Link
            href="/actualite"
            className="shrink-0 text-xs text-primary hover:underline"
          >
            Tout voir
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Derniers scrutins
            </p>
            <ul className="divide-y divide-border border border-border bg-card">
              {derniersScrutins.slice(0, 5).map((s) => {
                const adopte = s.sortCode
                  .toLowerCase()
                  .includes("adopt");
                return (
                  <li key={s.uid}>
                    <Link
                      href={`/scrutins/${s.uid}`}
                      className="flex hover:bg-muted"
                    >
                      <VoteBar
                        orientation="vertical"
                        pour={s.pour ?? 0}
                        contre={s.contre ?? 0}
                        abstentions={s.abstentions ?? 0}
                        className={
                          "flex w-1.5 shrink-0 flex-col " +
                          "self-stretch overflow-hidden"
                        }
                      />
                      <div className="min-w-0 flex-1 px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <time
                            dateTime={s.dateScrutin}
                            className="font-medium text-foreground"
                          >
                            {formatDateShort(s.dateScrutin)}
                          </time>
                          <span className="num">n° {s.numero}</span>
                          <Badge tone={adopte ? "adopte" : "rejete"}>
                            {formatSort(s.sortCode)}
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-snug">
                          {capitalizeTitre(s.titre)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Dossiers récents
            </p>
            <ul className="divide-y divide-border border border-border bg-card">
              {derniersDossiers.slice(0, 5).map((d) => (
                <li key={d.uid}>
                  <HomeDossierCard
                    uid={d.uid}
                    titre={d.titre}
                    procedureLibelle={d.procedureLibelle}
                    hasEmpreinte={d.hasEmpreinte}
                    scoreTotal={d.scoreTotal}
                    scoreMax={d.scoreMax}
                    empreinteImpacts={d.empreinteImpacts}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 border border-border bg-muted p-4 sm:p-5">
        <h2 className="font-serif text-lg text-foreground">
          Transparence
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Seuls les scrutins publics sont nominatifs. Les votes à main
          levée n&apos;apparaissent pas. La Boussole et la résonance
          mesurent un alignement avec vos valeurs — pas un jugement
          moral.
        </p>
      </section>
    </div>
  );
}
