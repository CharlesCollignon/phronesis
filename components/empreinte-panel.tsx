import type { InferSelectModel } from "drizzle-orm";

import { ExternalLink } from "@/components/external-link";
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
  non_aborde: "bg-[var(--ink)]/8 text-[var(--muted)]",
  indetermine: "bg-[var(--ink)]/8 text-[var(--muted)]",
};

/** Empreinte qualitative — aucun score numérique par axe. */
export function EmpreintePanel({
  rows,
}: EmpreintePanelProps): React.ReactElement {
  if (rows.length === 0) {
    return (
      <aside className=" border border-dashed border-[var(--ink)]/20 bg-[var(--wash)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Empreinte civique
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aucune empreinte n&apos;a encore été générée pour ce
          dossier. Elle décrit des impacts qualitatifs par axe
          (renforce / restreint / …), sans note morale.
        </p>
      </aside>
    );
  }

  const byAxe = new Map(rows.map((r) => [r.axe, r]));
  const meta = rows[0]!;

  return (
    <aside className=" border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Empreinte civique
        </p>
        <p className="text-xs text-[var(--muted)]">
          {meta.modele} · prompt {meta.promptVersion}
        </p>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Impacts qualitatifs — pas de score numérique, pas de jugement
        moral.
      </p>
      <ul className="mt-4 space-y-3">
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
              className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
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
                <summary className="cursor-pointer text-xs text-[var(--accent)]">
                  Pourquoi ?
                </summary>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/90">
                  {row.justification}
                </p>
                {row.sources.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
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
    </aside>
  );
}
