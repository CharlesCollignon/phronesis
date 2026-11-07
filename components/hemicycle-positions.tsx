"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type HemicyclePositionsProps = {
  pour: number;
  contre: number;
  abstentions: number;
  /** Nombre total de sièges (577 à l'Assemblée, 348 au Sénat). */
  sieges: number;
  className?: string;
};

type PositionKey = "pour" | "contre" | "abstention" | "absent";

type Seat = { x: number; y: number; k: number };

/** Disposition en demi-cercle, rangées proportionnelles au rayon. */
function layoutSeats(total: number): Seat[] {
  const rows = total > 400 ? 11 : 9;
  const r0 = 0.38;
  const radii: number[] = [];
  for (let i = 0; i < rows; i++) {
    radii.push(r0 + ((1 - r0) * i) / (rows - 1));
  }
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
  const seats: { th: number; r: number }[] = [];
  counts.forEach((n, i) => {
    for (let j = 0; j < n; j++) {
      seats.push({
        th: Math.PI - (Math.PI * j) / Math.max(1, n - 1),
        r: radii[i]!,
      });
    }
  });
  seats.sort((a, b) => b.th - a.th || a.r - b.r);
  return seats.map((s, k) => ({
    x: 50 + 48.5 * s.r * Math.cos(s.th),
    y: 96 - 90 * s.r * Math.sin(s.th),
    k,
  }));
}

const STYLE: Record<PositionKey, string> = {
  pour: "bg-[var(--vote-pour)]",
  contre: "bg-background shadow-[inset_0_0_0_1.5px_var(--foreground)]",
  abstention: "bg-[var(--vote-contre)]",
  absent: "bg-[var(--vote-neutre)]",
};

/**
 * Hémicycle des positions d'un scrutin (pas des places réelles).
 * Un clic sur un chiffre isole ses sièges, qui passent au jaune.
 */
export function HemicyclePositions({
  pour,
  contre,
  abstentions,
  sieges,
  className,
}: HemicyclePositionsProps): React.ReactElement {
  const [focus, setFocus] = useState<PositionKey | null>(null);
  const absents = Math.max(0, sieges - pour - contre - abstentions);
  const seats = useMemo(() => layoutSeats(sieges), [sieges]);

  const legend: { key: PositionKey; n: number; label: string }[] = [
    { key: "pour", n: pour, label: "pour" },
    { key: "contre", n: contre, label: "contre" },
    {
      key: "abstention",
      n: abstentions,
      label: abstentions > 1 ? "abstentions" : "abstention",
    },
    { key: "absent", n: absents, label: "absents ou non-votants" },
  ];

  const b1 = pour;
  const b2 = b1 + contre;
  const b3 = b2 + abstentions;
  function keyOf(k: number): PositionKey {
    if (k < b1) return "pour";
    if (k < b2) return "contre";
    if (k < b3) return "abstention";
    return "absent";
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-x-[clamp(32px,5vw,64px)] gap-y-8",
        className,
      )}
    >
      <div
        role="img"
        aria-label={`Hémicycle : ${pour} pour, ${contre} contre, ${abstentions} abstentions, ${absents} absents ou non-votants`}
        className="relative aspect-[2/1.04] min-w-0 flex-[3_1_440px]"
      >
        {seats.map((s) => {
          const key = keyOf(s.k);
          const hit = focus === key;
          return (
            <span
              key={s.k}
              className={cn(
                "hemi-seat absolute aspect-square w-[1.45%] rounded-full",
                hit ? "bg-[var(--accent)] shadow-none" : STYLE[key],
                focus && !hit && "opacity-25",
              )}
              style={{
                left: `${s.x.toFixed(2)}%`,
                top: `${s.y.toFixed(2)}%`,
                animationDelay: `${150 + s.k * 1.2}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="min-w-0 flex-[1_1_260px]">
        <div
          role="group"
          aria-label="Isoler une position dans l'hémicycle"
          className="border-b border-border"
        >
          {legend.map((l) => {
            const on = focus === l.key;
            return (
              <button
                key={l.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFocus(on ? null : l.key)}
                className={cn(
                  "grid w-full grid-cols-[14px_72px_minmax(0,1fr)] items-center gap-3 border-t border-border py-3 text-left transition-colors",
                  on
                    ? "bg-[var(--highlight)]"
                    : "hover:bg-[var(--hover)]",
                  focus && !on && "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "ml-1 size-2.5 rounded-full",
                    on
                      ? "bg-[var(--accent)]"
                      : l.key === "absent"
                        ? "bg-[var(--vote-neutre)] shadow-[inset_0_0_0_1px_var(--input)]"
                        : STYLE[l.key],
                  )}
                />
                <span className="num text-2xl font-medium">{l.n}</span>
                <span className="text-[15px]">{l.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
          Sélectionnez une position pour l&apos;isoler. Répartition des
          positions, pas des places réelles.
        </p>
      </div>
    </div>
  );
}
