import type { InferSelectModel } from "drizzle-orm";
import Link from "next/link";

import { ExternalLink } from "@/components/external-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { empreintes } from "@/db/schema";
import {
  AXE_LABELS,
  AXES_EMPREINTE,
  IMPACT_LABELS,
  isAxeEmpreinte,
  isImpactEmpreinte,
  type ImpactEmpreinte,
} from "@/lib/empreinte";

type Empreinte = InferSelectModel<typeof empreintes>;

type EmpreintePanelProps = {
  rows: Empreinte[];
};

const IMPACT_TONE: Record<ImpactEmpreinte, string> = {
  renforce: "bg-emerald-100 text-emerald-900",
  restreint: "bg-rose-100 text-rose-900",
  mitige: "bg-amber-100 text-amber-900",
  non_aborde: "bg-foreground/8 text-muted-foreground",
  indetermine: "bg-foreground/8 text-muted-foreground",
};

/** Note discrète : DDHC + DUDH = repères, pas une mesure. */
function RepereCiviqueNote(): React.ReactElement {
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
      Repères civiques (non mesurés) : DDHC 1789 et DUDH 1948 — voir{" "}
      <Link
        href="/methodologie#reperes-civiques"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        méthodologie
      </Link>
      .
    </p>
  );
}

/** Empreinte qualitative — aucun score numérique par axe. */
export function EmpreintePanel({
  rows,
}: EmpreintePanelProps): React.ReactElement {
  if (rows.length === 0) {
    return (
      <Card className="h-full rounded-none border-dashed shadow-none">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Empreinte civique
          </CardTitle>
          <CardDescription>
            Aucune empreinte n&apos;a encore été générée pour ce
            dossier. Elle décrit des impacts qualitatifs par axe
            (renforce / restreint / …), sans note morale.
          </CardDescription>
          <RepereCiviqueNote />
        </CardHeader>
      </Card>
    );
  }

  const byAxe = new Map(rows.map((r) => [r.axe, r]));
  const meta = rows[0]!;

  return (
    <Card className="h-full rounded-none shadow-sm">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Empreinte civique
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {meta.modele} · prompt {meta.promptVersion}
          </p>
        </div>
        <CardDescription>
          Impacts qualitatifs — pas de score numérique, pas de
          jugement moral.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="flex-1 space-y-3">
          {AXES_EMPREINTE.map((axe) => {
            const row = byAxe.get(axe);
            if (!row) return null;
            const impact = isImpactEmpreinte(row.impact)
              ? row.impact
              : "indetermine";
            const label = isAxeEmpreinte(axe)
              ? AXE_LABELS[axe]
              : axe;
            return (
              <li
                key={axe}
                className="border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span
                    className={` px-2 py-0.5 text-xs font-medium ${IMPACT_TONE[impact]}`}
                  >
                    {IMPACT_LABELS[impact]}
                  </span>
                </div>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-primary">
                    Pourquoi ?
                  </summary>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                    {row.justification}
                  </p>
                  {row.sources.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {row.sources.map((s) => (
                        <li key={s.url}>
                          <ExternalLink href={s.url}>
                            {s.label}
                          </ExternalLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto">
          <RepereCiviqueNote />
        </div>
      </CardContent>
    </Card>
  );
}
