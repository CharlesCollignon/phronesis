"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { VoteComparison } from "@/components/vote-comparison";
import { cn } from "@/lib/utils";

type Counts = {
  pour: number;
  contre: number;
  abstention: number;
  pasAvis: number;
  total: number;
};

type Position = "pour" | "contre" | "abstention" | "pas_avis";

const LABELS: { id: Position; label: string }[] = [
  { id: "pour", label: "Pour" },
  { id: "contre", label: "Contre" },
  { id: "abstention", label: "Abstention" },
  { id: "pas_avis", label: "Pas d'avis" },
];

type SondageScrutinProps = {
  scrutinUid: string;
  deputesPour: number;
  deputesContre: number;
  deputesAbstention: number;
};

function SondageInner({
  scrutinUid,
  isSignedIn,
  deputesPour,
  deputesContre,
  deputesAbstention,
}: SondageScrutinProps & {
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
          `/api/scrutins/${encodeURIComponent(scrutinUid)}/sondage`,
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
        if (!cancelled) setError("Impossible de charger le sondage.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scrutinUid]);

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
          `/api/scrutins/${encodeURIComponent(scrutinUid)}/sondage`,
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
          deselect
            ? "Suppression impossible."
            : "Enregistrement impossible.",
        );
      } finally {
        setSaving(false);
      }
    },
    [scrutinUid, isSignedIn, mine],
  );

  const display = counts ?? {
    pour: 0,
    contre: 0,
    abstention: 0,
    pasAvis: 0,
    total: 0,
  };
  const loading = counts === null && error === null;

  return (
    <section aria-labelledby="sondage-titre">
      <p className="eyebrow">Et vous ?</p>
      <h2
        id="sondage-titre"
        className="mt-2.5 text-[17px] font-medium leading-snug"
      >
        Qu&apos;auriez-vous voté ?
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Consultation non représentative,{" "}
        <strong className="font-medium text-foreground">
          pas un vote parlementaire
        </strong>
        . Votre avis est enregistré avec votre compte et n&apos;est publié
        qu&apos;en total.
      </p>

      <div
        role="group"
        aria-label="Votre position"
        className="mt-4 grid grid-cols-2 gap-1.5"
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
                "h-12 border px-2 text-[15px] font-medium transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--spring)] disabled:cursor-not-allowed disabled:opacity-50",
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

      {mine ? (
        <p key={mine} className="reveal mt-3 text-sm text-[#404040] dark:text-muted-foreground">
          Avis enregistré. Cliquez à nouveau pour le retirer.
        </p>
      ) : null}

      {!isSignedIn ? (
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href="/sign-in" className="ln text-foreground">
            Se connecter
          </Link>{" "}
          pour donner votre avis (nouveau clic pour le retirer).
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-foreground">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <VoteComparison
            deputes={{
              pour: deputesPour,
              contre: deputesContre,
              abstention: deputesAbstention,
            }}
            citoyens={{
              pour: display.pour,
              contre: display.contre,
              abstention: display.abstention,
              pasAvis: display.pasAvis,
            }}
          />
        )}
      </div>
    </section>
  );
}

function SondageWithClerk(
  props: SondageScrutinProps,
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
  return (
    <SondageInner {...props} isSignedIn={Boolean(isSignedIn)} />
  );
}

export function SondageScrutin(
  props: SondageScrutinProps,
): React.ReactElement {
  const hasClerk = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  if (!hasClerk) {
    return <SondageInner {...props} isSignedIn={false} />;
  }
  return <SondageWithClerk {...props} />;
}
