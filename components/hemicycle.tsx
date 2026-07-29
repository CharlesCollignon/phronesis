"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  arcPath,
  buildArcs,
  type GroupeHemicycleInput,
} from "@/lib/hemicycle";

type HemicycleProps = {
  groups: GroupeHemicycleInput[];
  chambre: "AN" | "SENAT";
  selectedUid?: string | null;
  compact?: boolean;
  className?: string;
};

export function Hemicycle({
  groups,
  chambre,
  selectedUid = null,
  compact = false,
  className = "",
}: HemicycleProps): React.ReactElement {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const arcs = useMemo(
    () => buildArcs(groups, chambre),
    [groups, chambre],
  );

  const w = compact ? 360 : 520;
  const h = compact ? 210 : 300;
  const cx = w / 2;
  const cy = h - 12;
  const rOuter = compact ? 155 : 230;
  const rInner = compact ? 70 : 105;

  const active = hover ?? selectedUid;
  const activeArc = arcs.find((a) => a.uid === active) ?? null;

  if (arcs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun groupe à représenter.
      </p>
    );
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label={
          `Hémicycle schématique ${chambre === "AN" ? "Assemblée nationale" : "Sénat"}`
        }
      >
        {arcs.map((arc) => {
          const isActive = active === arc.uid;
          const dimmed = active != null && !isActive;
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
              fill={arc.couleur}
              opacity={dimmed ? 0.35 : isActive ? 1 : 0.92}
              stroke={isActive ? "var(--foreground)" : "white"}
              strokeWidth={isActive ? 2 : 1}
              className="cursor-pointer transition-opacity"
              tabIndex={0}
              role="link"
              aria-label={`${arc.libelle}, ${arc.effectif} membres`}
              onMouseEnter={() => setHover(arc.uid)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(arc.uid)}
              onBlur={() => setHover(null)}
              onClick={() => router.push(`/groupes/${arc.uid}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/groupes/${arc.uid}`);
                }
              }}
            />
          );
        })}
      </svg>

      <div className="mt-2 min-h-10 text-center text-sm">
        {activeArc ? (
          <p>
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5"
              style={{ background: activeArc.couleur }}
            />
            <span className="font-medium">{activeArc.abrege}</span>
            <span className="text-muted-foreground">
              {" "}
              · {activeArc.libelle} · {activeArc.effectif}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Survolez ou sélectionnez un groupe
          </p>
        )}
      </div>

      <p className="mt-1 text-center text-xs text-muted-foreground">
        ← gauche · centre · droite → · représentation schématique
        (pas le plan de salle)
      </p>

      {!compact ? (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {arcs.map((arc) => (
            <li key={arc.uid}>
              <button
                type="button"
                onClick={() => router.push(`/groupes/${arc.uid}`)}
                onMouseEnter={() => setHover(arc.uid)}
                onMouseLeave={() => setHover(null)}
                className={
                  `inline-flex min-h-11 items-center gap-1.5 ` +
                  ` border border-border ` +
                  `bg-card px-2.5 text-xs ` +
                  (selectedUid === arc.uid
                    ? "ring-2 ring-[var(--accent)]"
                    : "")
                }
              >
                <span
                  className="h-2.5 w-2.5"
                  style={{ background: arc.couleur }}
                />
                {arc.abrege}
                <span className="text-muted-foreground">
                  {arc.effectif}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
