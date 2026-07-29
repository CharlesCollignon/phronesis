import Link from "next/link";

import { Badge } from "@/components/badge";
import { PageShell } from "@/components/breadcrumbs";
import { VoteBar } from "@/components/vote-bar";
import { formatDateShort, formatSort } from "@/lib/format";
import { getActualiteAssemblee } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "À l'Assemblée",
};

export default async function ActualitePage(): Promise<React.ReactElement> {
  const { scrutins, dossiers } = await getActualiteAssemblee();

  return (
    <PageShell
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: "À l'Assemblée" },
      ]}
    >
      <p className="text-sm font-medium uppercase tracking-[0.15em] text-primary">
        Actualité parlementaire
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">
        À l&apos;Assemblée
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Fil dérivé des données open data déjà ingérées (scrutins
        publics et dossiers récents) — pas un fil presse ni un
        agrégateur Twitter.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-2xl">
            Derniers scrutins publics
          </h2>
          {scrutins.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun scrutin en base — lancez l&apos;ingest ou
              vérifiez Postgres.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {scrutins.map((s) => (
                <li key={s.uid}>
                  <Link
                    href={`/scrutins/${s.uid}`}
                    className="card-sharp block p-4 transition hover:border-[var(--accent)]/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="num">n° {s.numero}</span>
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
                    <p className="mt-2 line-clamp-2 text-sm leading-snug">
                      {s.titre}
                    </p>
                    <div className="mt-3">
                      <VoteBar
                        pour={s.pour ?? 0}
                        contre={s.contre ?? 0}
                        abstentions={s.abstentions ?? 0}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-serif text-2xl">
            Dossiers récemment actifs
          </h2>
          {dossiers.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun dossier en base.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {dossiers.map((d) => (
                <li key={d.uid}>
                  <Link
                    href={`/dossiers/${d.uid}`}
                    className="card-sharp block p-4 transition hover:border-[var(--accent)]/40"
                  >
                    {d.procedureLibelle ? (
                      <p className="text-xs text-muted-foreground">
                        {d.procedureLibelle}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm leading-snug">
                      {d.titre}
                    </p>
                    {d.sondageTotal > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Avis citoyens :{" "}
                        <span className="num">
                          {d.sondagePour}
                        </span>{" "}
                        pour ·{" "}
                        <span className="num">
                          {d.sondageContre}
                        </span>{" "}
                        contre ·{" "}
                        <span className="num">
                          {d.sondagePasAvis}
                        </span>{" "}
                        sans avis (
                        <span className="num">{d.sondageTotal}</span>
                        )
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Pas encore d&apos;avis citoyens
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
