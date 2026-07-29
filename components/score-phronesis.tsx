import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="shrink-0 rounded-none shadow-sm">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Score Phronesis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {score.version}
          </p>
        </div>
        <CardDescription>
          Robustesse du socle documentaire — pas une note sur la
          loi.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="num text-3xl text-foreground">
          {score.total}
          <span className="text-lg text-muted-foreground">
            {" "}
            / {score.maxTotal}
          </span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden bg-foreground/10">
          <div
            className="h-full bg-foreground"
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
                <span className="ml-1 text-xs text-muted-foreground">
                  ({c.detail})
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {c.points}/{c.maxPoints}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-4 text-xs leading-relaxed text-muted-foreground">
          Formule détaillée dans la{" "}
          <Link
            href="/methodologie"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            méthodologie
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
