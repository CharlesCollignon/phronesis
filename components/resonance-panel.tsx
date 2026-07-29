"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars } from "@/components/profil-axes";
import { loadBoussoleProfil } from "@/lib/boussole-storage";
import { DILEMMES, type ProfilBoussole } from "@/lib/dilemmes";
import {
  computeResonance,
  type EmpreinteImpactRow,
} from "@/lib/resonance";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

type ResonancePanelProps = {
  rows: EmpreinteImpactRow[];
  compareLabel?: string;
  title?: string;
};

function ResonanceInner({
  rows,
  compareLabel = "Projection (empreinte)",
  title = "Résonance avec votre boussole",
  canUseProfil,
}: ResonancePanelProps & {
  canUseProfil: boolean;
}): React.ReactElement {
  const [profil, setProfil] = useState<ProfilBoussole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot(): Promise<void> {
      if (!canUseProfil) {
        if (!cancelled) {
          setProfil(null);
          setReady(true);
        }
        return;
      }
      const p = await loadBoussoleProfil({
        syncCloud: HAS_CLERK,
      });
      if (!cancelled) {
        setProfil(p);
        setReady(true);
      }
    }

    setReady(false);
    void boot();
    return () => {
      cancelled = true;
    };
  }, [canUseProfil]);

  const resonance = useMemo(
    () => (profil ? computeResonance(profil, rows) : null),
    [profil, rows],
  );

  if (!ready) {
    return (
      <aside className="border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </aside>
    );
  }

  if (!canUseProfil) {
    return (
      <aside className="border border-dashed border-border bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="text-primary hover:underline"
          >
            Connectez-vous
          </Link>{" "}
          et complétez la{" "}
          <Link href="/boussole" className="hover:underline">
            boussole
          </Link>{" "}
          pour comparer avec cette empreinte.
        </p>
      </aside>
    );
  }

  if (!profil) {
    return (
      <aside className="border border-dashed border-border bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Complétez la{" "}
          <Link
            href="/boussole"
            className="text-primary hover:underline"
          >
            boussole
          </Link>{" "}
          ({DILEMMES.length} dilemmes) pour activer la résonance avec{" "}
          {compareLabel.toLowerCase()}.
        </p>
      </aside>
    );
  }

  if (!resonance) {
    return (
      <aside className="border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Empreinte insuffisante pour une résonance sur les axes
          mappés.
        </p>
      </aside>
    );
  }

  const pct = Math.round(resonance.score * 100);

  return (
    <aside className="border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {compareLabel} · {resonance.axesCompares.length} axe
        {resonance.axesCompares.length > 1 ? "s" : ""} comparé
        {resonance.axesCompares.length > 1 ? "s" : ""}
      </p>
      <p className="num mt-4 text-3xl text-foreground">
        {pct}
        <span className="text-lg text-muted-foreground"> %</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Similarité de profil (cosinus) — pas un jugement moral
      </p>
      <div className="mt-4">
        <AxesBars
          profil={resonance.profilUtilisateur}
          compare={resonance.profilLoi}
          profilLabel="Votre boussole"
          compareLabel={compareLabel}
          axes={resonance.axesCompares}
          showHints={false}
        />
      </div>
    </aside>
  );
}

function ResonanceWithAuth(
  props: ResonancePanelProps,
): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <aside className="border border-border p-5 text-sm text-muted-foreground">
        Chargement…
      </aside>
    );
  }
  return (
    <ResonanceInner {...props} canUseProfil={Boolean(isSignedIn)} />
  );
}

/** Résonance optionnelle avec le profil Boussole (compte requis si Clerk). */
export function ResonancePanel(
  props: ResonancePanelProps,
): React.ReactElement {
  if (HAS_CLERK) {
    return <ResonanceWithAuth {...props} />;
  }
  return <ResonanceInner {...props} canUseProfil />;
}
