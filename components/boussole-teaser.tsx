"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AXE_BOUSSOLE_LABELS,
  DILEMMES,
  type AxeBoussole,
} from "@/lib/dilemmes";
import { cn } from "@/lib/utils";

/** Premier dilemme de la Boussole, jouable depuis l'accueil. */
export function BoussoleTeaser(): React.ReactElement | null {
  const dilemme = DILEMMES[0];
  const [choix, setChoix] = useState<string | null>(null);
  if (!dilemme) return null;

  const current = dilemme.choix.find((c) => c.id === choix) ?? null;
  const effets = current
    ? (Object.entries(current.poids) as [AxeBoussole, number][]).filter(
        ([, v]) => v !== 0,
      )
    : [];

  return (
    <div className="flex flex-wrap gap-12">
      <div className="min-w-0 flex-[1_1_300px]">
        <p className="eyebrow">
          Boussole · dilemme 1 sur {DILEMMES.length}
        </p>
        <h2 className="mt-3 text-[clamp(24px,2.6vw,32px)] font-medium leading-tight tracking-[-0.02em]">
          {dilemme.question}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Aucune question de type gauche ou droite. Vos réponses sont
          enregistrées sur votre appareil uniquement.
        </p>
      </div>
      <div className="min-w-0 flex-[1.4_1_460px]">
        <div
          role="radiogroup"
          aria-label="Votre réponse"
          className="border-b border-border"
        >
          {dilemme.choix.map((c, i) => {
            const on = choix === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChoix(on ? null : c.id)}
                className={cn(
                  "grid w-full grid-cols-[40px_minmax(0,1fr)] items-baseline gap-3 border-t border-border py-[18px] pr-3 text-left",
                  "transition-[background-color,box-shadow,color] duration-500 ease-[var(--spring)]",
                  on
                    ? "bg-[var(--highlight)] shadow-[inset_3px_0_0_0_var(--accent)]"
                    : "hover:bg-[var(--hover)]",
                  choix && !on && "text-muted-foreground",
                )}
              >
                <span className="pl-3.5 text-sm font-semibold text-muted-foreground">
                  {"ABCD".charAt(i)}
                </span>
                <span className="text-lg leading-snug">{c.label}</span>
              </button>
            );
          })}
        </div>
        {current ? (
          <div
            key={current.id}
            className="reveal mt-5 flex flex-wrap items-baseline gap-x-7 gap-y-2"
            aria-live="polite"
          >
            <span className="text-sm text-muted-foreground">
              Effet sur votre carte
            </span>
            {effets.map(([axe, v]) => (
              <span key={axe} className="text-base">
                {AXE_BOUSSOLE_LABELS[axe]}{" "}
                <strong className="num font-semibold">
                  {v > 0 ? `+${v}` : `−${Math.abs(v)}`}
                </strong>
              </span>
            ))}
            <Link
              href="/boussole"
              className="ln ml-auto text-[15px] font-medium"
            >
              Continuer la Boussole
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
