"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/badge";
import type { ComparaisonScrutin } from "@/lib/comparateur";
import {
  capitalizeTitre,
  formatDateShort,
  formatNumber,
  formatPosition,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Filtre = "tous" | "desaccords" | "accords";

function positionTone(
  position: string,
): "pour" | "contre" | "abstention" | "neutral" {
  if (position === "pour") return "pour";
  if (position === "contre") return "contre";
  if (position === "abstention") return "abstention";
  return "neutral";
}

type ComparateurScrutinsProps = {
  items: ComparaisonScrutin[];
  labelA: string;
  labelB: string;
  nbAccords: number;
  nbDesaccords: number;
};

/** Liste des scrutins communs, filtrable accord / désaccord. */
export function ComparateurScrutins({
  items,
  labelA,
  labelB,
  nbAccords,
  nbDesaccords,
}: ComparateurScrutinsProps): React.ReactElement {
  const [filtre, setFiltre] = useState<Filtre>("tous");

  const visibles = items.filter((s) =>
    filtre === "tous" ? true : filtre === "accords" ? s.accord : !s.accord,
  );

  const filtres: { id: Filtre; label: string }[] = [
    { id: "tous", label: "Tous" },
    { id: "desaccords", label: `Désaccords (${nbDesaccords})` },
    { id: "accords", label: `Accords (${nbAccords})` },
  ];

  const emptyText =
    filtre === "accords"
      ? "Aucune convergence dans l'échantillon."
      : filtre === "desaccords"
        ? "Aucune divergence dans l'échantillon."
        : "Aucun scrutin commun.";

  return (
    <div>
      <div
        role="group"
        aria-label="Filtrer les scrutins"
        className="flex flex-wrap gap-x-6 pt-4"
      >
        {filtres.map((f) => {
          const on = filtre === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFiltre(f.id)}
              className={cn(
                "relative py-1.5 text-[15px] font-medium transition-colors",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--accent)]",
                "after:transition-transform after:duration-500 after:ease-[var(--spring)]",
                on
                  ? "text-foreground after:origin-left after:scale-x-100"
                  : "text-muted-foreground after:origin-right after:scale-x-0 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 hidden grid-cols-[92px_minmax(0,1fr)_120px_120px_96px] gap-5 px-2 pb-2.5 text-[13px] text-muted-foreground md:grid">
        <span>Scrutin</span>
        <span>Objet</span>
        <span className="truncate" title={labelA}>
          {labelA}
        </span>
        <span className="truncate" title={labelB}>
          {labelB}
        </span>
        <span>Résultat</span>
      </div>
      {visibles.length === 0 ? (
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul key={filtre} className="border-b border-border max-md:mt-4">
          {visibles.map((s) => (
            <li key={s.scrutinUid} className="reveal">
              <Link
                href={`/scrutins/${s.scrutinUid}`}
                className="row-link grid grid-cols-[minmax(0,1fr)_88px] items-center gap-x-5 gap-y-2 border-t border-border px-2 py-4 md:grid-cols-[92px_minmax(0,1fr)_120px_120px_96px]"
              >
                <span className="num hidden text-sm text-muted-foreground md:block">
                  N° {formatNumber(s.numero)}
                  <span className="block text-[13px]">
                    {formatDateShort(s.dateScrutin)}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="num block text-[13px] text-muted-foreground md:hidden">
                    N° {formatNumber(s.numero)} ·{" "}
                    {formatDateShort(s.dateScrutin)}
                  </span>
                  <span className="line-clamp-3 text-base leading-snug">
                    {capitalizeTitre(s.titre)}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground md:hidden">
                    <span className="inline-flex items-center gap-2">
                      {labelA}
                      <Badge tone={positionTone(s.positionA)}>
                        {formatPosition(s.positionA)}
                      </Badge>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {labelB}
                      <Badge tone={positionTone(s.positionB)}>
                        {formatPosition(s.positionB)}
                      </Badge>
                    </span>
                  </span>
                </span>
                <span className="hidden md:block">
                  <Badge tone={positionTone(s.positionA)}>
                    {formatPosition(s.positionA)}
                  </Badge>
                </span>
                <span className="hidden md:block">
                  <Badge tone={positionTone(s.positionB)}>
                    {formatPosition(s.positionB)}
                  </Badge>
                </span>
                <span
                  className={cn(
                    "text-right text-sm font-semibold md:text-left",
                    s.accord ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.accord ? "Accord" : "Désaccord"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
