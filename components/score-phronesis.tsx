import Link from "next/link";

import type { ScorePhronesis } from "@/lib/score-phronesis";

type ScorePhronesisPanelProps = {
  score: ScorePhronesis;
};

/** Jauge de robustesse documentaire — pas un jugement moral. */
export function ScorePhronesisPanel({
  score,
}: ScorePhronesisPanelProps): React.ReactElement {
  return (
    <section
      aria-labelledby="score-phronesis-titre"
      className="border border-border p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p id="score-phronesis-titre" className="eyebrow">
          Score Phronesis
        </p>
        <p className="text-xs text-muted-foreground">{score.version}</p>
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className="num text-5xl font-medium leading-none tracking-[-0.03em]">
          {score.total}
        </span>
        <span className="text-base text-muted-foreground">
          / {score.maxTotal}
        </span>
      </p>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        Robustesse du socle documentaire du dossier. Ce n&apos;est pas une
        note sur la loi.
      </p>
      <ul className="mt-5 flex flex-col gap-3.5">
        {score.criteres.map((c, i) => {
          const pct =
            c.maxPoints > 0 ? Math.round((100 * c.points) / c.maxPoints) : 0;
          return (
            <li key={c.id}>
              <div className="flex justify-between gap-3 text-[13px]">
                <span>
                  {c.label}
                  <span className="text-muted-foreground"> · {c.detail}</span>
                </span>
                <span className="num shrink-0 text-muted-foreground">
                  {c.points} / {c.maxPoints}
                </span>
              </div>
              <div
                className="mt-1.5 h-1 bg-[var(--vote-neutre)]"
                role="img"
                aria-label={`${c.label} : ${c.points} sur ${c.maxPoints}`}
              >
                <div
                  className="grow-x h-full bg-foreground"
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${200 + i * 60}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
        Formule détaillée dans la{" "}
        <Link href="/methodologie" className="ln text-foreground">
          méthodologie
        </Link>
        .
      </p>
    </section>
  );
}
