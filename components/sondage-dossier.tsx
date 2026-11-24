"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { TotauxSondageDossier } from "@/lib/sondages";
import { cn } from "@/lib/utils";

type Counts = TotauxSondageDossier;

type Position = "pour" | "contre" | "pas_avis";

const LABELS: { id: Position; label: string }[] = [
  { id: "pour", label: "Pour" },
  { id: "contre", label: "Contre" },
  { id: "pas_avis", label: "Sans avis" },
];

type SondageDossierProps = {
  dossierUid: string;
  /** Totaux lus avec la fiche : les afficher ne demande aucun appel. */
  totaux: Counts;
};

function SondageInner({
  dossierUid,
  totaux,
  isSignedIn,
}: SondageDossierProps & {
  isSignedIn: boolean;
}): React.ReactElement {
  const [counts, setCounts] = useState<Counts>(totaux);
  const [mine, setMine] = useState<Position | null>(null);
  const [mineLoaded, setMineLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Seul un utilisateur connecté a un avis à retrouver. Un visiteur
    // anonyme n'appelle pas l'API : chaque appel réveillerait la base.
    if (!isSignedIn) return;
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
          setError("Impossible de retrouver votre avis.");
        }
      } finally {
        if (!cancelled) setMineLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dossierUid, isSignedIn]);

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

  const total = Math.max(counts.total, 1);
  const pPour = (100 * counts.pour) / total;
  const pContre = (100 * counts.contre) / total;
  const pAvis = (100 * counts.pasAvis) / total;
  // Tant que l'avis déjà donné n'est pas connu, un clic ne saurait pas
  // s'il doit l'enregistrer ou le retirer.
  const loading = isSignedIn && !mineLoaded;

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

      <div key={counts.total} className="reveal mt-4">
        <div
          className="flex h-1.5 w-full overflow-hidden bg-[var(--vote-neutre)]"
          role="img"
          aria-label={`Pour ${counts.pour}, contre ${counts.contre}, sans avis ${counts.pasAvis}`}
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
            <dd className="num font-medium">{counts.pour}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Contre</dt>
            <dd className="num font-medium">{counts.contre}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Sans avis</dt>
            <dd className="num font-medium">{counts.pasAvis}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Avis des citoyens Phronesis
        {counts.total > 0 ? (
          <>
            {" "}
            (<span className="num">{counts.total}</span>)
          </>
        ) : null}
        . Consultation non représentative de la population, pas un vote
        parlementaire. Votre avis est enregistré avec votre compte et
        n&apos;est publié qu&apos;en total.
        {mine ? " Cliquez à nouveau sur votre choix pour le retirer." : null}
      </p>

      {!isSignedIn ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          <Link prefetch={false} href="/sign-in" className="ln font-medium text-foreground">
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

function SondageWithClerk(
  props: SondageDossierProps,
): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <section>
        <p className="eyebrow">Et vous ?</p>
        <p className="mt-2.5 text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }
  return <SondageInner {...props} isSignedIn={Boolean(isSignedIn)} />;
}

export function SondageDossier(
  props: SondageDossierProps,
): React.ReactElement {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!hasClerk) {
    return <SondageInner {...props} isSignedIn={false} />;
  }
  return <SondageWithClerk {...props} />;
}
