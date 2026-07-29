"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Counts = {
  pour: number;
  contre: number;
  pasAvis: number;
  total: number;
};

type Position = "pour" | "contre" | "pas_avis";

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
    <Card className="rounded-none shadow-sm">
      <CardHeader className="gap-1 pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avis des citoyens Phronesis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Opinion plateforme — pas un vote parlementaire
            {display.total > 0 ? (
              <>
                {" "}
                · <span className="num">{display.total}</span> avis
              </>
            ) : null}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex h-2.5 w-full overflow-hidden bg-muted">
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
              <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Pour</dt>
                  <dd className="num font-medium text-foreground">
                    {display.pour}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Contre</dt>
                  <dd className="num font-medium text-foreground">
                    {display.contre}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Pas d&apos;avis</dt>
                  <dd className="num font-medium text-foreground">
                    {display.pasAvis}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {LABELS.map((opt) => {
                const selected = mine === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={saving || loading}
                    aria-pressed={selected}
                    title={
                      selected ? "Retirer mon avis" : undefined
                    }
                    onClick={() => void vote(opt.id)}
                    className={
                      `min-h-9 border px-3 text-sm font-medium ` +
                      `transition ${
                        selected
                          ? opt.selectedClass
                          : opt.idleClass
                      }`
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isSignedIn ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Se connecter
            </Link>{" "}
            pour voter (re-clic pour retirer).
          </p>
        ) : null}

        {error ? <p className="mt-2 text-xs text-rose-900">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function SondageWithClerk({
  dossierUid,
}: SondageDossierProps): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <Card className="rounded-none shadow-sm">
        <CardContent className="py-3 text-sm text-muted-foreground">
          Chargement…
        </CardContent>
      </Card>
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
