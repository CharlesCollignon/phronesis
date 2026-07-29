"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
  { id: "pas_avis", label: "Pas d'avis" },
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
      try {
        const res = await fetch(
          `/api/dossiers/${encodeURIComponent(dossierUid)}/sondage`,
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
    [dossierUid, isSignedIn],
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
    <aside className="card-sharp p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Avis des citoyens Phronesis
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sondage d&apos;opinion sur cette plateforme —{" "}
        <strong className="font-medium text-foreground">
          pas un vote parlementaire
        </strong>
        .
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <div className="mt-4 flex h-3 w-full overflow-hidden bg-muted">
            <div
              className="bg-[var(--vote-pour)]"
              style={{ width: `${pPour}%` }}
              title={`Pour ${display.pour}`}
            />
            <div
              className="bg-[var(--vote-contre)]"
              style={{ width: `${pContre}%` }}
              title={`Contre ${display.contre}`}
            />
            <div
              className="bg-[var(--vote-neutre)]"
              style={{ width: `${pAvis}%` }}
              title={`Pas d'avis ${display.pasAvis}`}
            />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <dt className="text-muted-foreground">Pour</dt>
              <dd className="num text-lg text-foreground">
                {display.pour}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contre</dt>
              <dd className="num text-lg text-foreground">
                {display.contre}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pas d&apos;avis</dt>
              <dd className="num text-lg text-foreground">
                {display.pasAvis}
              </dd>
            </div>
          </dl>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            <span className="num">{display.total}</span> avis
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {LABELS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={saving || loading}
            onClick={() => void vote(opt.id)}
            className={
              `min-h-11 flex-1 border px-3 text-sm ` +
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
            className="text-primary underline-offset-2 hover:underline"
          >
            Se connecter
          </Link>{" "}
          pour enregistrer votre avis (un par dossier, modifiable).
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-rose-900">{error}</p>
      ) : null}
    </aside>
  );
}

function SondageWithClerk({
  dossierUid,
}: SondageDossierProps): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <aside className="card-sharp p-5 text-sm text-muted-foreground">
        Chargement…
      </aside>
    );
  }
  return (
    <SondageInner
      dossierUid={dossierUid}
      isSignedIn={Boolean(isSignedIn)}
    />
  );
}

export function SondageDossier({
  dossierUid,
}: SondageDossierProps): React.ReactElement {
  const hasClerk = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  if (!hasClerk) {
    return (
      <SondageInner dossierUid={dossierUid} isSignedIn={false} />
    );
  }
  return <SondageWithClerk dossierUid={dossierUid} />;
}
