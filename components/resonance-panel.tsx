"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars } from "@/components/profil-axes";
import { loadBoussoleStored } from "@/lib/boussole-storage";
import {
  DILEMMES,
  computeProfil,
  type ProfilBoussole,
} from "@/lib/dilemmes";
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

function loadProfilComplet(): ProfilBoussole | null {
  const stored = loadBoussoleStored();
  const valid: Record<string, string> = {};
  for (const d of DILEMMES) {
    const choixId = stored.reponses[d.id];
    if (choixId && d.choix.some((c) => c.id === choixId)) {
      valid[d.id] = choixId;
    }
  }
  if (DILEMMES.every((d) => valid[d.id])) {
    return computeProfil(valid);
  }
  return null;
}

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
    if (canUseProfil) {
      setProfil(loadProfilComplet());
    } else {
      setProfil(null);
    }
    setReady(true);
  }, [canUseProfil]);

  const resonance = useMemo(
    () => (profil ? computeResonance(profil, rows) : null),
    [profil, rows],
  );

  if (!ready) {
    return (
      <aside className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--muted)]">Chargement…</p>
      </aside>
    );
  }

  if (!canUseProfil) {
    return (
      <aside className="border border-dashed border-[var(--border)] bg-[var(--wash)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {title}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <Link
            href="/sign-in"
            className="text-[var(--accent-ink)] hover:underline"
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
      <aside className="border border-dashed border-[var(--border)] bg-[var(--wash)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {title}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Complétez la{" "}
          <Link
            href="/boussole"
            className="text-[var(--accent-ink)] hover:underline"
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
      <aside className="border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {title}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Empreinte insuffisante pour une résonance sur les axes
          mappés.
        </p>
      </aside>
    );
  }

  const pct = Math.round(resonance.score * 100);

  return (
    <aside className="border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {title}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {compareLabel} · {resonance.axesCompares.length} axe
        {resonance.axesCompares.length > 1 ? "s" : ""} comparé
        {resonance.axesCompares.length > 1 ? "s" : ""}
      </p>
      <p className="num mt-4 text-3xl text-[var(--ink)]">
        {pct}
        <span className="text-lg text-[var(--muted)]"> %</span>
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
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
      <aside className="border border-[var(--border)] p-5 text-sm text-[var(--muted)]">
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
