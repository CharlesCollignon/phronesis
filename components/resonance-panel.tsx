"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AxesBars } from "@/components/profil-axes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function ResonanceShell({
  title,
  description,
  children,
  dashed = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  dashed?: boolean;
}): React.ReactElement {
  return (
    <Card
      className={
        dashed
          ? "h-full rounded-none border-dashed shadow-none"
          : "h-full rounded-none shadow-sm"
      }
    >
      <CardHeader className="gap-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      {children ? (
        <CardContent className="flex flex-1 flex-col">
          {children}
        </CardContent>
      ) : null}
    </Card>
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
      <ResonanceShell title={title}>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </ResonanceShell>
    );
  }

  if (!canUseProfil) {
    return (
      <ResonanceShell title={title} dashed>
        <p className="text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Connectez-vous
          </Link>{" "}
          et complétez la{" "}
          <Link
            href="/boussole"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            boussole
          </Link>{" "}
          pour comparer avec cette empreinte.
        </p>
      </ResonanceShell>
    );
  }

  if (!profil) {
    return (
      <ResonanceShell title={title} dashed>
        <p className="text-sm text-muted-foreground">
          Complétez la{" "}
          <Link
            href="/boussole"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            boussole
          </Link>{" "}
          ({DILEMMES.length} dilemmes) pour activer la résonance
          avec {compareLabel.toLowerCase()}.
        </p>
      </ResonanceShell>
    );
  }

  if (!resonance) {
    return (
      <ResonanceShell title={title}>
        <p className="text-sm text-muted-foreground">
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
      <p className="num text-3xl text-foreground">
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
        <p className="text-sm text-muted-foreground">Chargement…</p>
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
