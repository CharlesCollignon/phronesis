"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars } from "@/components/profil-axes";
import {
  loadBoussoleProfil,
  nombreDilemmesRepondus,
} from "@/lib/boussole-storage";
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

function ResonanceShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="h-full border border-transparent bg-[#0a0a0a] p-6 text-white [--muted-foreground:#a3a3a3] dark:border-[#2e2e2e]">
      <p className="eyebrow text-[#a3a3a3]">{title}</p>
      {description ? (
        <p className="mt-1.5 text-[13px] text-[#a3a3a3]">{description}</p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function ResonanceInner({
  rows,
  compareLabel = "Projection (empreinte)",
  title = "Résonance avec votre boussole",
  canUseProfil,
}: ResonancePanelProps & {
  canUseProfil: boolean;
}): React.ReactElement {
  // On mémorise pour quelle valeur de canUseProfil le chargement a
  // abouti : `ready` et `profil` en découlent. Auparavant un
  // setReady(false) synchrone dans le corps de l'effet remettait le
  // panneau en « Chargement… », au prix d'un rendu en cascade.
  const [loaded, setLoaded] = useState<{
    canUseProfil: boolean;
    profil: ProfilBoussole | null;
    /** Dilemmes déjà répondus (Boussole entamée mais incomplète). */
    repondus: number;
  } | null>(null);

  const ready =
    loaded !== null && loaded.canUseProfil === canUseProfil;
  const profil = ready ? loaded.profil : null;
  const repondus = ready ? loaded.repondus : 0;

  useEffect(() => {
    let cancelled = false;

    async function boot(): Promise<void> {
      if (!canUseProfil) {
        if (!cancelled) {
          setLoaded({ canUseProfil: false, profil: null, repondus: 0 });
        }
        return;
      }
      const p = await loadBoussoleProfil({
        syncCloud: HAS_CLERK,
      });
      if (!cancelled) {
        setLoaded({
          canUseProfil: true,
          profil: p,
          repondus: nombreDilemmesRepondus(),
        });
      }
    }

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
      <ResonanceShell title={title}>
        <p className="text-[15px] text-[#a3a3a3]">Chargement…</p>
      </ResonanceShell>
    );
  }

  if (!canUseProfil) {
    return (
      <ResonanceShell title={title}>
        <p className="text-base leading-relaxed text-[#e5e5e5]">
          Connectez-vous et complétez la Boussole pour mesurer la
          résonance entre cette projection et votre propre carte de
          valeurs.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/boussole" className="btn btn-accent">
            Faire ma Boussole
          </Link>
          <Link href="/sign-in" className="ln text-[15px] font-medium">
            Se connecter
          </Link>
        </div>
      </ResonanceShell>
    );
  }

  if (!profil) {
    return (
      <ResonanceShell title={title}>
        <p className="text-base leading-relaxed text-[#e5e5e5]">
          {repondus > 0 ? (
            <>
              Votre Boussole n&apos;est pas terminée : il vous reste{" "}
              {DILEMMES.length - repondus} dilemme
              {DILEMMES.length - repondus > 1 ? "s" : ""} sur{" "}
              {DILEMMES.length} pour activer la résonance avec cette
              projection.
            </>
          ) : (
            <>
              Faites la Boussole ({DILEMMES.length} dilemmes) pour activer
              la résonance avec cette projection.
            </>
          )}
        </p>
        <Link href="/boussole" className="btn btn-accent mt-5">
          {repondus > 0 ? "Reprendre ma Boussole" : "Faire ma Boussole"}
        </Link>
      </ResonanceShell>
    );
  }

  if (!resonance) {
    return (
      <ResonanceShell title={title}>
        <p className="text-[15px] leading-relaxed text-[#e5e5e5]">
          Empreinte insuffisante pour une résonance sur les axes
          mappés.
        </p>
      </ResonanceShell>
    );
  }

  const pct = Math.round(resonance.score * 100);
  const nAxes = resonance.axesCompares.length;
  const axeWord = nAxes > 1 ? "s" : "";

  return (
    <ResonanceShell
      title={title}
      description={
        `${compareLabel} · ${nAxes} axe${axeWord} ` +
        `comparé${axeWord}`
      }
    >
      <p className="flex items-baseline gap-1.5">
        <span className="num text-5xl font-medium leading-none tracking-[-0.03em]">
          {pct}
        </span>
        <span className="text-base text-[#a3a3a3]">%</span>
      </p>
      <p className="mt-2 text-[13px] text-[#a3a3a3]">
        Similarité de profil (cosinus). Pas un jugement moral.
      </p>
      <div className="mt-5 text-white">
        <AxesBars
          profil={resonance.profilUtilisateur}
          compare={resonance.profilLoi}
          profilLabel="Votre boussole"
          compareLabel={compareLabel}
          axes={resonance.axesCompares}
          showHints={false}
        />
      </div>
    </ResonanceShell>
  );
}

function ResonanceWithAuth(
  props: ResonancePanelProps,
): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <ResonanceShell
        title={props.title ?? "Résonance avec votre boussole"}
      >
        <p className="text-[15px] text-[#a3a3a3]">Chargement…</p>
      </ResonanceShell>
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
