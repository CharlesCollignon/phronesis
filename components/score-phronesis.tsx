import Link from "next/link";

import type { ScorePhronesis } from "@/lib/score-phronesis";

type ScorePhronesisPanelProps = {
  score: ScorePhronesis;
};

/** Jauge de robustesse documentaire — pas un jugement moral. */
export function ScorePhronesisPanel({
  score,
}: ScorePhronesisPanelProps): React.ReactElement {
  const pct =
    score.maxTotal > 0
      ? Math.round((100 * score.total) / score.maxTotal)
      : 0;

  return (
    <aside className=" border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Score Phronesis
        </p>
        <p className="text-xs text-[var(--muted)]">{score.version}</p>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Robustesse du socle documentaire — pas une note sur la loi.
      </p>
      <p className="num mt-3 text-3xl text-[var(--ink)]">
        {score.total}
        <span className="text-lg text-[var(--muted)]">
          {" "}
          / {score.maxTotal}
        </span>
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden bg-[var(--ink)]/10">
        <div
          className="h-full bg-[var(--ink)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {score.criteres.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-3"
          >
            <span>
              <span className="mr-1.5" aria-hidden>
                {c.rempli ? "✓" : "○"}
              </span>
              {c.label}
              <span className="ml-1 text-xs text-[var(--muted)]">
                ({c.detail})
              </span>
            </span>
            <span className="shrink-0 text-xs text-[var(--muted)]">
              {c.points}/{c.maxPoints}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Formule détaillée dans la{" "}
        <Link href="/methodologie" className="underline">
          méthodologie
        </Link>
        .
      </p>
    </aside>
  );
}
