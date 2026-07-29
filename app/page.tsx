import Link from "next/link";

import { Badge } from "@/components/badge";
import { Stat } from "@/components/stat";
import {
  capitalizeTitre,
  formatDate,
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

  const todayLabel = formatDate(
    new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="border-b border-[var(--border)] pb-8 pt-2 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
          {todayLabel}
          {derniereDateScrutin ? (
            <>
              {" · "}
              Dernier scrutin en base :{" "}
              {formatDateShort(derniereDateScrutin)}
            </>
          ) : null}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-logo)] text-4xl tracking-wide text-[var(--logo)] sm:text-5xl">
          PHRONESIS
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
          Du grec <span className="italic">phrónēsis</span> : sagesse
          pratique — la capacité à discerner et à juger avec mesure
          dans des situations concrètes.
        </p>
        <p className="mt-2 text-xs text-[var(--marine)]">
          Comprendre avant de juger
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Dossiers"
          value={formatNumber(Number(counts.dossiers))}
        />
        <Stat
          label="Scrutins"
          value={formatNumber(Number(counts.scrutins))}
        />
        <Stat
          label="Députés"
          value={formatNumber(Number(counts.deputes))}
        />
        <Stat
          label="Positions"
          value={formatNumber(Number(counts.votes))}
        />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              À l&apos;Assemblée
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Scrutins et dossiers récents issus de l&apos;open data —
              pas de fil presse externe.
            </p>
          </div>
          <Link
            href="/actualite"
            className="shrink-0 text-xs text-[var(--accent-ink)] hover:underline"
          >
            Tout voir
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
              Derniers scrutins
            </p>
            <ul className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--surface)]">
              {derniersScrutins.slice(0, 5).map((s) => (
                <li key={s.uid}>
                  <Link
                    href={`/scrutins/${s.uid}`}
                    className="block px-3 py-3 hover:bg-[var(--surface-muted)]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <time
                        dateTime={s.dateScrutin}
                        className="font-medium text-[var(--ink)]"
                      >
                        {formatDateShort(s.dateScrutin)}
                      </time>
                      <span className="num">n° {s.numero}</span>
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
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug">
                      {capitalizeTitre(s.titre)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
              Dossiers récents
            </p>
            <ul className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--surface)]">
              {derniersDossiers.slice(0, 5).map((d) => (
                <li key={d.uid}>
                  <Link
                    href={`/dossiers/${d.uid}`}
                    className="block px-3 py-3 hover:bg-[var(--surface-muted)]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      {d.procedureLibelle ? (
                        <span>{d.procedureLibelle}</span>
                      ) : null}
                      {d.hasEmpreinte ? (
                        <Badge tone="adopte">Empreinte</Badge>
                      ) : (
                        <span className="text-[var(--muted)]">
                          Empreinte à venir
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-snug">
                      {d.titre}
                    </p>
                    {d.hasEmpreinte ? (
                      <p className="mt-1 text-xs text-[var(--accent-ink)]">
                        Impacts qualitatifs disponibles — comparez
                        avec votre Boussole
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          Transparence
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
          Seuls les scrutins publics sont nominatifs. Les votes à main
          levée n&apos;apparaissent pas — limite des données
          officielles. La Boussole et la résonance mesurent un
          alignement avec vos valeurs, pas un jugement moral.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
          <Link
            href="/methodologie"
            className="text-[var(--accent-ink)] hover:underline"
          >
            Méthodologie
          </Link>
          <Link
            href="/boussole"
            className="text-[var(--accent-ink)] hover:underline"
          >
            Faire la Boussole
          </Link>
        </div>
      </section>
    </div>
  );
}
