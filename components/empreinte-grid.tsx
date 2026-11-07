"use client";

import { useState } from "react";

import {
  AXE_LABELS,
  AXES_EMPREINTE,
  IMPACT_LABELS,
  isImpactEmpreinte,
  type ImpactEmpreinte,
} from "@/lib/empreinte";
import { cn } from "@/lib/utils";

export type EmpreinteGridRow = {
  axe: string;
  impact: string;
  justification: string;
  sources?: { label: string; url: string }[];
};

/** Symboles typographiques : la forme porte le sens, pas la couleur. */
export const IMPACT_SYMBOL: Record<ImpactEmpreinte, string> = {
  renforce: "+",
  restreint: "−",
  mitige: "±",
  non_aborde: "∅",
  indetermine: "?",
};

export const IMPACT_LEGEND =
  "+ renforce · − restreint · ± mitigé · ∅ non abordé · ? indéterminé";

type EmpreinteGridProps = {
  rows: EmpreinteGridRow[];
  /** Axe ouvert au chargement (défaut : premier axe abordé). */
  initialAxe?: string | null;
  /** Largeur minimale d'une case. */
  cellMin?: number;
};

/**
 * Grille des dix axes : chaque case montre l'impact par un symbole ;
 * la case choisie se surligne et affiche sa justification dessous.
 */
export function EmpreinteGrid({
  rows,
  initialAxe,
  cellMin = 160,
}: EmpreinteGridProps): React.ReactElement {
  const byAxe = new Map(rows.map((r) => [r.axe, r]));
  const firstAddressed =
    AXES_EMPREINTE.find((a) => {
      const r = byAxe.get(a);
      return r && r.impact !== "non_aborde";
    }) ?? null;
  const [selected, setSelected] = useState<string | null>(
    initialAxe === undefined ? firstAddressed : initialAxe,
  );

  const current = selected ? byAxe.get(selected) : undefined;
  const currentImpact: ImpactEmpreinte =
    current && isImpactEmpreinte(current.impact)
      ? current.impact
      : "indetermine";

  return (
    <div>
      <div
        className="grid border-l border-t border-border"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellMin}px, 1fr))`,
        }}
      >
        {AXES_EMPREINTE.map((axe) => {
          const row = byAxe.get(axe);
          const impact: ImpactEmpreinte =
            row && isImpactEmpreinte(row.impact)
              ? row.impact
              : "indetermine";
          const on = selected === axe;
          const muted = !row || impact === "non_aborde";
          return (
            <button
              key={axe}
              type="button"
              aria-pressed={on}
              disabled={!row}
              onClick={() => setSelected(on ? null : axe)}
              className={cn(
                "flex min-h-[112px] flex-col justify-between gap-4 border-b border-r border-border p-3.5 text-left",
                "transition-[background-color,box-shadow] duration-500 ease-[var(--spring)]",
                "disabled:cursor-default",
                on
                  ? "bg-[var(--highlight)] shadow-[inset_0_3px_0_0_var(--accent)]"
                  : "bg-background hover:bg-[var(--hover)]",
              )}
            >
              <span className="text-[15px] font-medium">
                {AXE_LABELS[axe]}
              </span>
              <span className="flex items-end justify-between gap-2">
                <span
                  aria-hidden
                  className="text-[28px] font-light leading-none"
                >
                  {IMPACT_SYMBOL[impact]}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    muted && !on
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {row ? IMPACT_LABELS[impact] : "Non renseigné"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {current && selected ? (
        <div key={selected} className="reveal pt-5" aria-live="polite">
          <p className="text-[17px] font-semibold">
            {AXE_LABELS[selected as keyof typeof AXE_LABELS] ?? selected}{" "}
            · {IMPACT_LABELS[currentImpact]}
          </p>
          <p className="mt-2 max-w-3xl text-base leading-relaxed">
            {current.justification}
          </p>
          {current.sources && current.sources.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {current.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ln"
                  >
                    {s.label}
                    <span aria-hidden> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
