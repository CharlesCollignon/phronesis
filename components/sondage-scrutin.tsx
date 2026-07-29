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
      try {
        const res = await fetch(
          `/api/scrutins/${encodeURIComponent(scrutinUid)}/sondage`,
          {
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
          mine: Position;
        };
        setCounts(data.counts);
        setMine(data.mine);
      } catch {
        setError("Enregistrement impossible.");
      } finally {
        setSaving(false);
      }
    },
    [scrutinUid, isSignedIn],
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
          {LABELS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={saving || loading}
              onClick={() => void vote(opt.id)}
              className={
                `min-h-10 flex-1 border px-2 text-xs sm:text-sm ` +
                (mine === opt.id
                  ? "border-[var(--accent)] bg-accent " +
                    "font-medium text-foreground"
                  : "border-border bg-muted " +
                    "text-foreground hover:border-[var(--accent)]/50")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!isSignedIn ? (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link
              href="/sign-in"
              className="text-primary hover:underline"
            >
              Se connecter
            </Link>{" "}
            pour voter (un avis par scrutin, modifiable).
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
