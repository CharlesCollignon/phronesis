"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  arcPath,
  buildArcs,
  type GroupeHemicycleInput,
} from "@/lib/hemicycle";
import { cn } from "@/lib/utils";

type HemicycleProps = {
  groups: GroupeHemicycleInput[];
  chambre: "AN" | "SENAT";
  selectedUid?: string | null;
  compact?: boolean;
  className?: string;
};

/**
 * Hémicycle schématique par groupe. Volontairement neutre : tous les
 * groupes en gris, le groupe sélectionné ou survolé en jaune.
 * Les couleurs de partis ne servent pas d'encodage.
 */
export function Hemicycle({
  groups,
  chambre,
  selectedUid = null,
  compact = false,
  className,
}: HemicycleProps): React.ReactElement {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const arcs = useMemo(
    () => buildArcs(groups, chambre),
    [groups, chambre],
  );
  const total = arcs.reduce((s, a) => s + a.effectif, 0);

  const w = compact ? 360 : 520;
  const h = compact ? 196 : 280;
  const cx = w / 2;
  const cy = h - 6;
  const rOuter = compact ? 170 : 254;
  const rInner = compact ? 78 : 116;

  const active = hover ?? selectedUid;
  const activeArc = arcs.find((a) => a.uid === active) ?? null;

  if (arcs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun groupe à représenter.
      </p>
    );
  }

  const go = (uid: string): void => router.push(`/groupes/${uid}`);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto block w-full max-w-xl"
        role="group"
        aria-label={`Hémicycle schématique ${chambre === "AN" ? "Assemblée nationale" : "Sénat"}`}
      >
        {arcs.map((arc) => {
          const isOn = arc.uid === hover || arc.uid === selectedUid;
          return (
            <path
              key={arc.uid}
              d={arcPath(
                cx,
                cy,
                rInner,
                rOuter,
                arc.startAngle,
                arc.endAngle,
              )}
              style={{
                fill: isOn ? "var(--accent)" : "var(--vote-abstention)",
              }}
              stroke="var(--background)"
              strokeWidth={2}
              className="cursor-pointer outline-none transition-[fill] duration-300 focus-visible:stroke-[var(--foreground)]"
              tabIndex={0}
              role="link"
              aria-label={`${arc.libelle}, ${arc.effectif} membres`}
              aria-current={arc.uid === selectedUid ? "true" : undefined}
              onMouseEnter={() => setHover(arc.uid)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(arc.uid)}
              onBlur={() => setHover(null)}
              onClick={() => go(arc.uid)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(arc.uid);
                }
              }}
            />
          );
        })}
      </svg>

      <div
        className="mt-3 min-h-11 text-center text-[15px]"
        aria-live="polite"
      >
        {activeArc ? (
          <p key={activeArc.uid} className="reveal">
            <span className="font-semibold">{activeArc.abrege}</span>
            <span className="text-muted-foreground">
              {" "}
              · {activeArc.libelle} ·{" "}
            </span>
            <span className="num">
              {activeArc.effectif} siège
              {activeArc.effectif > 1 ? "s" : ""}
              {total > 0
                ? ` (${((100 * activeArc.effectif) / total).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)`
                : ""}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Survolez ou sélectionnez un groupe
          </p>
        )}
      </div>

      <p className="mt-1 text-center text-[13px] text-muted-foreground">
        ← gauche · centre · droite → · représentation schématique
        (pas le plan de salle)
      </p>

      {!compact ? (
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {arcs.map((arc) => {
            const sel = selectedUid === arc.uid;
            return (
              <li key={arc.uid}>
                <button
                  type="button"
                  onClick={() => go(arc.uid)}
                  onMouseEnter={() => setHover(arc.uid)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(arc.uid)}
                  onBlur={() => setHover(null)}
                  aria-current={sel ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 border border-border px-3 text-[13px] font-medium",
                    "transition-[background-color,box-shadow] duration-300",
                    sel || hover === arc.uid
                      ? "bg-[var(--highlight)] shadow-[inset_0_3px_0_0_var(--accent)]"
                      : "bg-background hover:bg-[var(--hover)]",
                  )}
                >
                  {arc.abrege}
                  <span className="num text-muted-foreground">
                    {arc.effectif}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
