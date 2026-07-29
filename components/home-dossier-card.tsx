"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loadBoussoleProfil } from "@/lib/boussole-storage";
import type { ProfilBoussole } from "@/lib/dilemmes";
import {
  computeResonance,
  type EmpreinteImpactRow,
} from "@/lib/resonance";
import { cn } from "@/lib/utils";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

type HomeDossierCardProps = {
  uid: string;
  titre: string;
  procedureLibelle: string | null;
  hasEmpreinte: boolean;
  scoreTotal: number;
  scoreMax: number;
  empreinteImpacts: EmpreinteImpactRow[];
};

/** Carte dossier home : score Phronesis + résonance Boussole. */
export function HomeDossierCard(
  props: HomeDossierCardProps,
): React.ReactElement {
  if (HAS_CLERK) {
    return <HomeDossierCardWithAuth {...props} />;
  }
  return <HomeDossierCardInner {...props} canUseProfil />;
}

function HomeDossierCardWithAuth(
  props: HomeDossierCardProps,
): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <HomeDossierCardInner {...props} canUseProfil={false} />
    );
  }
  return (
    <HomeDossierCardInner
      {...props}
      canUseProfil={Boolean(isSignedIn)}
    />
  );
}

function HomeDossierCardInner({
  uid,
  titre,
  procedureLibelle,
  hasEmpreinte,
  scoreTotal,
  scoreMax,
  empreinteImpacts,
  canUseProfil,
}: HomeDossierCardProps & {
  canUseProfil: boolean;
}): React.ReactElement {
  const [profil, setProfil] = useState<ProfilBoussole | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot(): Promise<void> {
      if (!canUseProfil) {
        if (!cancelled) setProfil(null);
        return;
      }
      const p = await loadBoussoleProfil({
        syncCloud: HAS_CLERK,
      });
      if (!cancelled) setProfil(p);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [canUseProfil]);

  const resonance =
    profil && empreinteImpacts.length > 0
      ? computeResonance(profil, empreinteImpacts)
      : null;
  const resonancePct =
    resonance != null ? Math.round(resonance.score * 100) : null;

  return (
    <Link
      href={`/dossiers/${uid}`}
      className="relative block px-3 py-3 pr-16 hover:bg-muted"
    >
      <span
        className={cn(
          "absolute right-2 top-2 rounded-full px-2 py-0.5",
          "text-[10px] font-semibold tabular-nums",
          "bg-accent text-accent-foreground",
        )}
        title="Score Phronesis (robustesse documentaire)"
      >
        {scoreTotal}/{scoreMax}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {procedureLibelle ? <span>{procedureLibelle}</span> : null}
        {hasEmpreinte ? (
          <span className="text-emerald-700 dark:text-emerald-300">
            Empreinte
          </span>
        ) : (
          <span>Empreinte à venir</span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm leading-snug">{titre}</p>
      {resonancePct != null ? (
        <p className="mt-1.5 text-xs text-primary">
          Résonance Boussole : {resonancePct} %
        </p>
      ) : hasEmpreinte ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {HAS_CLERK && !canUseProfil
            ? "Connectez-vous pour la résonance"
            : "Complétez la Boussole pour la résonance"}
        </p>
      ) : null}
    </Link>
  );
}
