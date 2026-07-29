"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { VoteComparison } from "@/components/vote-comparison";

type Counts = {
  pour: number;
  contre: number;
  abstention: number;
  pasAvis: number;
  total: number;
};

type Position = "pour" | "contre" | "abstention" | "pas_avis";

const LABELS: {
  id: Position;
  label: string;
  selectedClass: string;
  idleClass: string;
}[] = [
  {
    id: "pour",
    label: "Pour",
    selectedClass:
      "border-[var(--vote-pour)] bg-[var(--vote-pour)] " +
      "text-white",
    idleClass:
      "border-[var(--vote-pour)]/50 bg-[var(--vote-pour)]/10 " +
      "text-[var(--vote-pour)] hover:bg-[var(--vote-pour)]/20",
  },
  {
    id: "contre",
    label: "Contre",
    selectedClass:
      "border-[var(--vote-contre)] bg-[var(--vote-contre)] " +
      "text-white",
    idleClass:
      "border-[var(--vote-contre)]/50 bg-[var(--vote-contre)]/10 " +
      "text-[var(--vote-contre)] hover:bg-[var(--vote-contre)]/20",
  },
  {
    id: "abstention",
    label: "Abstention",
    selectedClass:
      "border-[var(--vote-abstention)] " +
      "bg-[var(--vote-abstention)] text-white",
    idleClass:
      "border-[var(--vote-abstention)]/50 " +
      "bg-[var(--vote-abstention)]/10 " +
      "text-[var(--vote-abstention)] " +
      "hover:bg-[var(--vote-abstention)]/20",
  },
  {
    id: "pas_avis",
    label: "Pas d'avis",
    selectedClass:
      "border-[var(--vote-neutre)] bg-[var(--vote-neutre)] " +
      "text-white",
    idleClass:
      "border-[var(--vote-neutre)]/50 bg-[var(--vote-neutre)]/10 " +
      "text-[var(--vote-neutre)] hover:bg-[var(--vote-neutre)]/20",
  },
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
    <section className="space-y-4">
      <div className="border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Comparer députés et citoyens
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sondage d&apos;opinion —{" "}
          <strong className="text-foreground">
            pas un vote parlementaire
          </strong>
          .
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="mt-4">
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
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
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
                className={
                  `min-h-10 flex-1 border px-2 text-xs font-medium ` +
                  `transition sm:text-sm ${
                    selected ? opt.selectedClass : opt.idleClass
                  }`
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {!isSignedIn ? (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link
              href="/sign-in"
              className="text-primary hover:underline"
            >
              Se connecter
            </Link>{" "}
            pour voter (re-clic pour retirer).
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-xs text-rose-900">{error}</p>
        ) : null}
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
      <div className="border border-border p-4 text-sm text-muted-foreground">
        Chargement…
      </div>
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
