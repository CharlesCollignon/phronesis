"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Counts = {
  pour: number;
  contre: number;
  pasAvis: number;
  total: number;
};

type Position = "pour" | "contre" | "pas_avis";

const LABELS: { id: Position; label: string }[] = [
  { id: "pour", label: "Pour" },
  { id: "contre", label: "Contre" },
  { id: "pas_avis", label: "Sans avis" },
];

type SondageDossierProps = {
  dossierUid: string;
};

function SondageInner({
  dossierUid,
  isSignedIn,
}: SondageDossierProps & {
  isSignedIn: boolean;
}): React.ReactElement {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [mine, setMine] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/dossiers/${encodeURIComponent(dossierUid)}/sondage`,
        );
        if (!res.ok) throw new Error("load");
        const data = (await res.json()) as {
          counts: Counts;
          mine: Position | null;
        };
        if (cancelled) return;
        setCounts(data.counts);
        setMine(data.mine);
      } catch {
        if (!cancelled) {
          setError("Impossible de charger le sondage.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dossierUid]);

  const vote = useCallback(
    async (position: Position): Promise<void> => {
      if (!isSignedIn) {
        setError("Connectez-vous pour donner votre avis.");
        return;
      }
      setSaving(true);
      setError(null);
      const deselect = mine === position;
      try {
        const res = await fetch(
          `/api/dossiers/${encodeURIComponent(dossierUid)}/sondage`,
          deselect
            ? { method: "DELETE" }
            : {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ position }),
              },
        );
        if (res.status === 401) {
          setError("Connectez-vous pour donner votre avis.");
          return;
        }
        if (!res.ok) throw new Error("vote failed");
        const data = (await res.json()) as {
          counts: Counts;
          mine: Position | null;
        };
        setCounts(data.counts);
        setMine(data.mine);
      } catch {
        setError(
          deselect ? "Suppression impossible." : "Enregistrement impossible.",
        );
      } finally {
        setSaving(false);
      }
    },
    [dossierUid, isSignedIn, mine],
  );

  const display = counts ?? {
    pour: 0,
    contre: 0,
    pasAvis: 0,
    total: 0,
  };
  const total = Math.max(display.total, 1);
  const pPour = (100 * display.pour) / total;
  const pContre = (100 * display.contre) / total;
  const pAvis = (100 * display.pasAvis) / total;
  const loading = counts === null && error === null;

  return (
    <section aria-labelledby={`sondage-${dossierUid}`}>
      <p id={`sondage-${dossierUid}`} className="eyebrow">
        Et vous ?
      </p>
      <p className="mt-2.5 text-base leading-snug">
        Seriez-vous favorable à ce texte ?
      </p>
      <div
        role="group"
        aria-label="Votre avis"
        className="mt-3.5 flex gap-1.5"
      >
        {LABELS.map((opt) => {
          const selected = mine === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={saving || loading}
              aria-pressed={selected}
              title={selected ? "Retirer mon avis" : undefined}
              onClick={() => void vote(opt.id)}
              className={cn(
                "h-12 flex-1 border text-[15px] font-medium",
                "transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--spring)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-foreground bg-[var(--highlight)] shadow-[inset_0_-3px_0_0_var(--accent)]"
                  : "border-input bg-background hover:border-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-3.5 text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div key={display.total} className="reveal mt-4">
          <div
            className="flex h-1.5 w-full overflow-hidden bg-[var(--vote-neutre)]"
            role="img"
            aria-label={`Pour ${display.pour}, contre ${display.contre}, sans avis ${display.pasAvis}`}
          >
            <div
              className="bg-[var(--vote-pour)]"
              style={{ width: `${pPour}%` }}
            />
            <div
              className="bg-[var(--vote-contre)]"
              style={{ width: `${pContre}%` }}
            />
            <div
              className="bg-[var(--vote-abstention)]"
              style={{ width: `${pAvis}%` }}
            />
          </div>
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px]">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Pour</dt>
              <dd className="num font-medium">{display.pour}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Contre</dt>
              <dd className="num font-medium">{display.contre}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Sans avis</dt>
              <dd className="num font-medium">{display.pasAvis}</dd>
            </div>
          </dl>
        </div>
      )}

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Avis des citoyens Phronesis
        {display.total > 0 ? (
          <>
            {" "}
            (<span className="num">{display.total}</span>)
          </>
        ) : null}
        . Opinion de la plateforme, pas un vote parlementaire.
        {mine ? " Cliquez à nouveau sur votre choix pour le retirer." : null}
      </p>

      {!isSignedIn ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          <Link href="/sign-in" className="ln font-medium text-foreground">
            Se connecter
          </Link>{" "}
          pour donner votre avis.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[13px] font-medium">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function SondageWithClerk({
  dossierUid,
}: SondageDossierProps): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <section>
        <p className="eyebrow">Et vous ?</p>
        <p className="mt-2.5 text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }
  return (
    <SondageInner dossierUid={dossierUid} isSignedIn={Boolean(isSignedIn)} />
  );
}

export function SondageDossier({
  dossierUid,
}: SondageDossierProps): React.ReactElement {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!hasClerk) {
    return <SondageInner dossierUid={dossierUid} isSignedIn={false} />;
  }
  return <SondageWithClerk dossierUid={dossierUid} />;
}
