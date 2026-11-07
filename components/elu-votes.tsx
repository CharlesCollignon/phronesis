"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/badge";
import {
  capitalizeTitre,
  formatDateShort,
  formatNumber,
  formatPosition,
  formatSort,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export type EluVote = {
  scrutinUid: string;
  numero: number;
  dateScrutin: string | null;
  titre: string;
  sortCode: string;
  position: string;
  parDelegation: boolean | null;
};

type Filtre = "tous" | "pour" | "contre" | "abstention";

const FILTRES: { id: Filtre; label: string }[] = [
  { id: "tous", label: "Toutes" },
  { id: "pour", label: "Pour" },
  { id: "contre", label: "Contre" },
  { id: "abstention", label: "Abstention" },
];

function tone(
  position: string,
): "pour" | "contre" | "abstention" | "neutral" {
  if (position === "pour" || position === "contre") return position;
  if (position === "abstention") return "abstention";
  return "neutral";
}

/** Votes récents d'un élu, filtrables par position. */
export function EluVotes({
  votes,
  title = "Votes récents",
}: {
  votes: EluVote[];
  title?: string;
}): React.ReactElement {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const visibles =
    filtre === "tous" ? votes : votes.filter((v) => v.position === filtre);

  return (
    <section className="pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border">
        <h2 className="pb-3 text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight tracking-[-0.015em]">
          {title}
        </h2>
        <div
          role="group"
          aria-label="Filtrer par position"
          className="flex flex-wrap gap-x-5"
        >
          {FILTRES.map((f) => {
            const on = filtre === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFiltre(f.id)}
                className={cn(
                  "relative min-h-11 py-1.5 text-[15px] font-medium transition-colors",
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
      </div>

      <div className="hidden grid-cols-[96px_100px_minmax(0,1fr)_110px_88px] gap-5 px-2 pb-2.5 pt-3 text-[13px] text-muted-foreground md:grid">
        <span>Numéro</span>
        <span>Date</span>
        <span>Objet</span>
        <span>Position</span>
        <span>Résultat</span>
      </div>

      {visibles.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-foreground">
          Aucun vote « {formatPosition(filtre)} » parmi les {votes.length}{" "}
          derniers scrutins.
        </p>
      ) : (
        <ul key={filtre} className="border-b border-border">
          {visibles.map((v, i) => (
            <li
              key={v.scrutinUid}
              className="reveal"
              style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
            >
              <Link
                href={`/scrutins/${v.scrutinUid}`}
                className="row-link grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-1 border-t border-border px-2 py-4 md:grid-cols-[96px_100px_minmax(0,1fr)_110px_88px]"
              >
                <span className="num hidden text-sm text-[#404040] dark:text-muted-foreground md:block">
                  N° {formatNumber(v.numero)}
                </span>
                <span className="num hidden text-sm text-muted-foreground md:block">
                  {formatDateShort(v.dateScrutin)}
                </span>
                <span className="text-base leading-snug">
                  <span className="num mb-1 block text-[13px] text-muted-foreground md:hidden">
                    N° {formatNumber(v.numero)} ·{" "}
                    {formatDateShort(v.dateScrutin)} ·{" "}
                    {formatSort(v.sortCode)}
                  </span>
                  {capitalizeTitre(v.titre)}
                  {v.parDelegation ? (
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      · par délégation
                    </span>
                  ) : null}
                </span>
                <span>
                  <Badge tone={tone(v.position)}>
                    {formatPosition(v.position)}
                  </Badge>
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {formatSort(v.sortCode)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[13px] text-muted-foreground">
        {votes.length} derniers scrutins publics où l&apos;élu apparaît.
      </p>
    </section>
  );
}
