import Link from "next/link";

import { Badge } from "@/components/badge";
import { AccordGauge } from "@/components/charts/accord-gauge";
import { Stat } from "@/components/stat";
import type {
  ComparaisonResume,
  ComparaisonScrutin,
} from "@/lib/comparateur";
import { formatDateShort, formatPosition } from "@/lib/format";

type ComparaisonResultsProps = {
  labelA: string;
  labelB: string;
  hrefA?: string;
  hrefB?: string;
  resume: ComparaisonResume;
  convergences: ComparaisonScrutin[];
  divergences: ComparaisonScrutin[];
  showNonVotants?: boolean;
};

function positionTone(
  position: string,
): "pour" | "contre" | "abstention" | "neutral" {
  if (position === "pour") return "pour";
  if (position === "contre") return "contre";
  if (position === "abstention") return "abstention";
  return "neutral";
}

function ScrutinList({
  items,
  labelA,
  labelB,
  empty,
}: {
  items: ComparaisonScrutin[];
  labelA: string;
  labelB: string;
  empty: string;
}): React.ReactElement {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li key={s.scrutinUid}>
          <Link
            href={`/scrutins/${s.scrutinUid}`}
            className="block border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--accent)]/40"
          >
            <p className="text-xs text-[var(--muted)]">
              {formatDateShort(s.dateScrutin)} · n° {s.numero}
            </p>
            <p className="mt-1 line-clamp-2 text-sm">{s.titre}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span>
                {labelA}:{" "}
                <Badge tone={positionTone(s.positionA)}>
                  {formatPosition(s.positionA)}
                </Badge>
              </span>
              <span>
                {labelB}:{" "}
                <Badge tone={positionTone(s.positionB)}>
                  {formatPosition(s.positionB)}
                </Badge>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ComparaisonResults({
  labelA,
  labelB,
  hrefA,
  hrefB,
  resume,
  convergences,
  divergences,
  showNonVotants = false,
}: ComparaisonResultsProps): React.ReactElement {
  const taux =
    resume.tauxAccord != null
      ? `${(resume.tauxAccord * 100).toFixed(1)} %`
      : "—";

  return (
    <div className="mt-10 space-y-10">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          {hrefA ? (
            <Link href={hrefA} className="hover:text-[var(--accent)]">
              {labelA}
            </Link>
          ) : (
            labelA
          )}
          <span className="mx-2 text-[var(--muted)]">×</span>
          {hrefB ? (
            <Link href={hrefB} className="hover:text-[var(--accent)]">
              {labelB}
            </Link>
          ) : (
            labelB
          )}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Accord mesuré sur les scrutins publics où les deux ont une
          position pour, contre ou abstention. Les non-votants sont
          exclus du taux d&apos;accord.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccordGauge taux={resume.tauxAccord} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Taux d'accord" value={taux} />
          <Stat
            label="Scrutins comparés"
            value={String(resume.compares)}
          />
          <Stat label="Accords" value={String(resume.accords)} />
          <Stat
            label="Divergences"
            value={String(resume.divergences)}
          />
          {showNonVotants ? (
            <>
              <Stat
                label={`Non-votant (${labelA})`}
                value={String(resume.nonVotantA)}
                hint="Sur les scrutins communs"
              />
              <Stat
                label={`Non-votant (${labelB})`}
                value={String(resume.nonVotantB)}
                hint="Sur les scrutins communs"
              />
              <Stat
                label={`Seulement ${labelA}`}
                value={String(resume.seulementA)}
              />
              <Stat
                label={`Seulement ${labelB}`}
                value={String(resume.seulementB)}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h3 className="font-[family-name:var(--font-display)] text-xl">
            Divergences
          </h3>
          <div className="mt-3">
            <ScrutinList
              items={divergences}
              labelA={labelA}
              labelB={labelB}
              empty="Aucune divergence dans l'échantillon."
            />
          </div>
        </section>
        <section>
          <h3 className="font-[family-name:var(--font-display)] text-xl">
            Convergences
          </h3>
          <div className="mt-3">
            <ScrutinList
              items={convergences}
              labelA={labelA}
              labelB={labelB}
              empty="Aucune convergence dans l'échantillon."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
